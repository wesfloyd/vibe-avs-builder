import type { Session } from 'next-auth';

export interface GuestUser {
  id: string;
  email: string;
  name: string;
}

export interface GuestSession extends Omit<Session, 'user'> {
  user: GuestUser;
}

export function createGuestSession(): GuestSession {
  return {
    user: {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'guest@example.com',
      name: 'Guest User',
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

export function getSessionWithFallback(session: Session | null): GuestSession {
  if (!session?.user?.id) {
    console.log('Creating fallback guest session');
    return createGuestSession();
  }
  return session as GuestSession;
}
