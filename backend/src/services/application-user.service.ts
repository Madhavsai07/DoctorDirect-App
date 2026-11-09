import { DbUser, userRepository } from '../repositories/user.repository';

export interface AuthenticatedIdentity {
  id: string;
  email: string;
  email_confirmed_at?: string | null;
}

export interface ApplicationUserLookup {
  findByAuthUserId(authUserId: string): Promise<DbUser | null>;
  findUnlinkedByEmail(email: string): Promise<DbUser | null>;
  linkAuthUserByVerifiedEmail(authUserId: string, email: string): Promise<DbUser | null>;
}

export async function resolveApplicationUser(
  identity: AuthenticatedIdentity,
  repository: ApplicationUserLookup = userRepository
): Promise<DbUser | null> {
  const linkedUser = await repository.findByAuthUserId(identity.id);
  if (linkedUser) return linkedUser;

  if (!identity.email_confirmed_at) {
    const unlinkedUser = await repository.findUnlinkedByEmail(identity.email);
    if (unlinkedUser) {
      throw Object.assign(
        new Error('Verify your email address before linking this application account.'),
        { status: 403, code: 'EMAIL_VERIFICATION_REQUIRED' }
      );
    }
    return null;
  }

  return repository.linkAuthUserByVerifiedEmail(identity.id, identity.email);
}
