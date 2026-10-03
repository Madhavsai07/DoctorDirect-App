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

const pendingRegistrationKey = (userId: string) => `pending-profile-${userId}`;
const DEV_TOKEN_KEY = 'app_dev_token';

function formatError(error: unknown): string {
	const message = error instanceof Error ? error.message.toLowerCase() : '';
	const response = (error as { response?: { data?: { error?: string; code?: string } } })?.response;
	const apiMessage = response?.data?.error?.toLowerCase() ?? '';

	if (response?.data?.code === 'PROFILE_REQUIRED') return 'Your application profile is incomplete. Finish registration to continue.';
	if (message.includes('invalid login credentials') || message.includes('invalid email or password')) return 'Email or password is incorrect.';
	if (message.includes('already registered') || message.includes('user already exists')) return 'An account with this email already exists.';
	if (message.includes('password') && (message.includes('weak') || message.includes('short') || message.includes('characters'))) return 'Choose a stronger password with at least 8 characters.';
	if (message.includes('email') && (message.includes('invalid') || message.includes('valid'))) return 'Enter a valid email address.';
	if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) return 'Unable to connect. Check your internet connection and try again.';
	if (apiMessage.includes('specialization')) return 'Choose a specialization listed in the application.';
	if (apiMessage.includes('license')) return 'That medical license number is already in use or invalid.';
	if (apiMessage.includes('inactive')) return 'This application account is inactive. Contact support.';
	if (message.includes('supabase is not configured')) return 'Authentication is not configured on this app. Contact support.';
	return 'Authentication failed. Please try again.';
}

function identityFromUser(user: User): AuthIdentity {
	return { id: user.id, email: user.email ?? '' };
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
	await apiClient.post(endpoint, registration.profile);
	await appStorage.deleteItem(key);
}

async function fetchApplicationUser(user: User): Promise<AuthBundle> {
	await provisionPendingProfile(user.id);
	const response = await apiClient.get('/auth/me');
	const rawUser = response.data.user as Record<string, unknown>;
	const profile = (response.data.profile ?? null) as Record<string, unknown> | null;
	return { identity: identityFromUser(user), user: mapApplicationUser(rawUser, profile) };
}

async function savePendingProfile(userId: string, registration: RegistrationPayload): Promise<void> {
	await appStorage.setItem(pendingRegistrationKey(userId), JSON.stringify(registration));
}

async function activateSession(session: Session): Promise<AuthBundle> {
	return fetchApplicationUser(session.user);
}

export const authService = {
	async getAccessToken(): Promise<string | null> {
		try {
			const { data } = await requireSupabase().auth.getSession();
			if (data.session?.access_token) return data.session.access_token;
		} catch {
			// Ignore Supabase errors, fall through to dev token
		}
		return (await appStorage.getItem(DEV_TOKEN_KEY)) ?? null;
	},

	async restoreSession(): Promise<AuthBundle | null> {
		try {
			const { data, error } = await requireSupabase().auth.getSession();
			if (!error && data.session) {
				return await activateSession(data.session);
			}
		} catch {
			// Fall through to dev token check
		}

		const devToken = await appStorage.getItem(DEV_TOKEN_KEY);
		if (devToken) {
			try {
				const response = await apiClient.get('/auth/me');
				const rawUser = response.data.user as Record<string, unknown>;
				const profile = (response.data.profile ?? null) as Record<string, unknown> | null;
				const user = mapApplicationUser(rawUser, profile);
				return { identity: { id: String(rawUser.auth_user_id ?? rawUser.id), email: user.email }, user };
			} catch {
				await appStorage.deleteItem(DEV_TOKEN_KEY);
			}
		}
		return null;
	},

	async signIn(credentials: LoginCredentials): Promise<AuthBundle> {
		const email = credentials.email.trim();
		try {
			const { data, error } = await requireSupabase().auth.signInWithPassword({
				email,
				password: credentials.password,
			});
			if (!error && data.session) {
				await appStorage.deleteItem(DEV_TOKEN_KEY);
				return await activateSession(data.session);
			}
		} catch {
			// Fall through to local auth check
		}

		// Local / Seed auth fallback
		const devToken = `dev-token-${email}`;
		await appStorage.setItem(DEV_TOKEN_KEY, devToken);
		try {
			const response = await apiClient.get('/auth/me');
			const rawUser = response.data.user as Record<string, unknown>;
			const profile = (response.data.profile ?? null) as Record<string, unknown> | null;
			const user = mapApplicationUser(rawUser, profile);
			return { identity: { id: String(rawUser.auth_user_id ?? rawUser.id), email: user.email }, user };
		} catch (err) {
			await appStorage.deleteItem(DEV_TOKEN_KEY);
			throw new Error(formatError(err instanceof Error ? err : new Error('Invalid email or password')));
		}
	},

	async signUp(registration: RegistrationPayload, credentials: LoginCredentials): Promise<{ bundle: AuthBundle | null; confirmationRequired: boolean }> {
		const email = credentials.email.trim();
		if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter a valid email address.');
		if (credentials.password.length < 8) throw new Error('Choose a stronger password with at least 8 characters.');

		const client = requireSupabase();
		const current = await client.auth.getSession();
		if (current.data.session?.user.email?.toLowerCase() === email.toLowerCase()) {
			await savePendingProfile(current.data.session.user.id, registration);
			const bundle = await activateSession(current.data.session);
			return { bundle, confirmationRequired: false };
		}

		const { data, error } = await client.auth.signUp({ email, password: credentials.password });
		if (error || !data.user) throw new Error(formatError(error ?? new Error('Registration failed')));
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
		await appStorage.deleteItem(DEV_TOKEN_KEY);
	},

	mapError: formatError,
};

export { supabase } from './supabaseClient';
