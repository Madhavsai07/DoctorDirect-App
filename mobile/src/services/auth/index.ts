import type { Session, User } from '@supabase/supabase-js';
import apiClient from '../api/apiClient';
import {
	AuthBundle,
	AuthIdentity,
	AuthUser,
	LoginCredentials,
	RegistrationPayload,
	UserRole,
} from '../../types/auth';
import { requireSupabase } from './supabaseClient';
import { appStorage } from './storageAdapter';
import { getApiErrorMessage } from '../../utils/apiError';

const pendingRegistrationKey = (userId: string) => `pending-profile-${userId}`;

function formatError(error: unknown): string {
	const message = error instanceof Error ? error.message.toLowerCase() : '';
	const response = (error as { response?: { data?: { error?: string; code?: string } } })?.response;
	const apiMessage = response?.data?.error?.toLowerCase() ?? '';

	if (message.includes('session is no longer valid')) return 'Your session expired. Please sign in again.';
	if (message.includes('already registered') || message.includes('user already exists') ||
		apiMessage.includes('already exists') || apiMessage.includes('already registered')) {
		return 'An account with this email already exists. Please sign in instead.';
	}
	if (response?.data?.code === 'PROFILE_REQUIRED') return 'Your application profile is incomplete. Finish registration to continue.';
	if (message.includes('invalid login credentials') || message.includes('invalid email or password')) return 'Email or password is incorrect.';
	if (message.includes('password') && (message.includes('weak') || message.includes('short') || message.includes('characters'))) return 'Choose a stronger password with at least 8 characters.';
	if (message.includes('email') && (message.includes('invalid') || message.includes('valid'))) return 'Enter a valid email address.';
	if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) return 'Unable to connect. Check your internet connection and try again.';
	if (apiMessage.includes('specialization')) return 'Choose a specialization listed in the application.';
	if (apiMessage.includes('license')) return 'That medical license number is already in use or invalid.';
	if (apiMessage.includes('inactive')) return 'This application account is inactive. Contact support.';
	if (message.includes('id card') || message.includes('supabase storage') || apiMessage.includes('id card')) {
		return error instanceof Error ? error.message : 'Unable to upload the ID card.';
	}
	if (message.includes('supabase is not configured')) return 'Authentication is not configured on this app. Contact support.';
	if (message.includes('sign out before creating another account')) return 'Sign out before creating another account.';
	return getApiErrorMessage(error, 'Authentication failed. Please try again.');
}

function identityFromUser(user: User): AuthIdentity {
	return { id: user.id, email: user.email ?? '' };
}

async function uploadDoctorIdCard(userId: string, uri: string, contentType: 'image/jpeg' | 'image/png'): Promise<string> {
	const response = await fetch(uri);
	if (!response.ok) throw new Error('Unable to read the selected ID card image.');

	const image = await response.arrayBuffer();
	if (image.byteLength === 0 || image.byteLength > 10 * 1024 * 1024) {
		throw new Error('The ID card image must be non-empty and 10 MB or smaller.');
	}

	const extension = contentType === 'image/png' ? 'png' : 'jpg';
	const objectPath = `${userId}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}.${extension}`;
	const { data, error } = await requireSupabase()
		.storage
		.from('doctor-id-cards')
		.upload(objectPath, image, { contentType, upsert: false });
	if (error) throw new Error(`Unable to upload the ID card image: ${error.message}`);
	return data.path;
}

function mapApplicationUser(raw: Record<string, unknown>, profile: Record<string, unknown> | null): AuthUser {
	const role = raw.role;
	if (role !== 'patient' && role !== 'doctor' && role !== 'admin') throw new Error('This account role is not supported in the app.');
	return {
		id: String(raw.id),
		email: String(raw.email),
		role: role as UserRole,
		firstName: String(raw.firstName ?? raw.first_name ?? ''),
		lastName: String(raw.lastName ?? raw.last_name ?? ''),
		phone: typeof raw.phone === 'string' ? raw.phone : undefined,
		profileId: profile && typeof profile.id === 'string' ? profile.id : undefined,
		specialization: profile && typeof profile.specialization_name === 'string' ? profile.specialization_name : undefined,
		verificationStatus: profile && typeof profile.verification_status === 'string' ? (profile.verification_status as 'pending' | 'approved' | 'rejected') : undefined,
	};
}

async function provisionPendingProfile(userId: string): Promise<void> {
	const key = pendingRegistrationKey(userId);
	const stored = await appStorage.getItem(key);
	if (!stored) return;

	const registration = JSON.parse(stored) as RegistrationPayload;
	const endpoint = registration.role === 'doctor' ? '/auth/register/doctor' : '/auth/register/patient';

	if (registration.role === 'doctor') {
		let idCardUrl = registration.profile.idCardUrl;
		if (!idCardUrl) {
			const { idCardUri, idCardMimeType } = registration.profile;
			if (!idCardUri || !idCardMimeType) {
				throw new Error('Select a JPG or PNG government ID card before submitting your doctor application.');
			}
			idCardUrl = await uploadDoctorIdCard(userId, idCardUri, idCardMimeType);
			registration.profile = {
				...registration.profile,
				idCardUrl,
				idCardUri: undefined,
				idCardMimeType: undefined,
			};
			await appStorage.setItem(key, JSON.stringify(registration));
		}
		const profile = { ...registration.profile, idCardUrl };
		delete profile.idCardUri;
		delete profile.idCardMimeType;
		await apiClient.post(endpoint, profile);
	} else {
		await apiClient.post(endpoint, registration.profile);
	}
	await appStorage.deleteItem(key);
}

async function fetchApplicationUser(user: User): Promise<AuthBundle> {
	try {
		await provisionPendingProfile(user.id);
		const response = await apiClient.get('/auth/me');
		const rawUser = response.data.user as Record<string, unknown>;
		const profile = (response.data.profile ?? null) as Record<string, unknown> | null;
		return { identity: identityFromUser(user), user: mapApplicationUser(rawUser, profile) };
	} catch (error) {
		const response = (error as { response?: { status?: number; data?: { code?: string } } })?.response;
		if (response?.status === 401 || (response?.status === 403 && response.data?.code !== 'PROFILE_REQUIRED')) {
			const { error: signOutError } = await requireSupabase().auth.signOut({ scope: 'local' });
			if (signOutError) throw signOutError;
			throw new Error('Your session is no longer valid. Please sign in again.');
		}
		throw error;
	}
}

async function savePendingProfile(userId: string, registration: RegistrationPayload): Promise<void> {
	await appStorage.setItem(pendingRegistrationKey(userId), JSON.stringify(registration));
}

async function activateSession(session: Session): Promise<AuthBundle> {
	return fetchApplicationUser(session.user);
}

export const authService = {
	async getAccessToken(): Promise<string | null> {
		const { data, error } = await requireSupabase().auth.getSession();
		if (error) throw error;
		return data.session?.access_token ?? null;
	},

	async restoreSession(): Promise<AuthBundle | null> {
		const { data, error } = await requireSupabase().auth.getSession();
		if (error) throw error;
		if (!data.session) return null;
		try {
			return await activateSession(data.session);
		} catch (activationError) {
			const { data: refreshedSession, error: sessionError } = await requireSupabase().auth.getSession();
			if (sessionError) throw sessionError;
			if (!refreshedSession.session) return null;
			throw activationError;
		}
	},

	async signIn(credentials: LoginCredentials): Promise<AuthBundle> {
		const email = credentials.email.trim();
		const { data, error } = await requireSupabase().auth.signInWithPassword({
			email,
			password: credentials.password,
		});
		if (error) throw error;
		if (!data.session) throw new Error('Sign-in did not create an authenticated session.');
		return activateSession(data.session);
	},

	async signUp(registration: RegistrationPayload, credentials: LoginCredentials): Promise<{ bundle: AuthBundle | null; confirmationRequired: boolean }> {
		const email = credentials.email.trim();
		if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter a valid email address.');
		if (credentials.password.length < 8) throw new Error('Choose a stronger password with at least 8 characters.');

		const client = requireSupabase();
		const current = await client.auth.getSession();
		if (current.error) throw current.error;
		if (current.data.session) {
			if (current.data.session.user.email?.toLowerCase() !== email.toLowerCase()) {
				throw new Error('Sign out before creating another account.');
			}
			await savePendingProfile(current.data.session.user.id, registration);
			const bundle = await activateSession(current.data.session);
			return { bundle, confirmationRequired: false };
		}

		const { data, error } = await client.auth.signUp({ email, password: credentials.password });
		if (error) throw error;
		if (!data.user) throw new Error('Registration did not create an account.');
		await savePendingProfile(data.user.id, registration);
		if (!data.session) return { bundle: null, confirmationRequired: true };

		const bundle = await activateSession(data.session);
		return { bundle, confirmationRequired: false };
	},

	async logout(): Promise<void> {
		try {
			const client = requireSupabase();
			const { data } = await client.auth.getSession();
			const userId = data.session?.user.id;
			await client.auth.signOut({ scope: 'local' });
			if (userId) await appStorage.deleteItem(pendingRegistrationKey(userId));
		} catch {
			// Ignore Supabase signout error
		}
	},

	mapError: formatError,
};

export { supabase } from './supabaseClient';
