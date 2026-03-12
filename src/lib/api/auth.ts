import type { NextRequest } from 'next/server';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '@/lib/firebase/admin';

export const SESSION_COOKIE_NAME = 'nova_session';

export class AuthError extends Error {
  status: number;
  code: 'missing_session' | 'invalid_session';
  constructor(message: string, status: number, code: AuthError['code']) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function requireSession(request: NextRequest): Promise<DecodedIdToken> {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    throw new AuthError('Not authenticated.', 401, 'missing_session');
  }

  try {
    return await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    throw new AuthError('Invalid session.', 401, 'invalid_session');
  }
}

