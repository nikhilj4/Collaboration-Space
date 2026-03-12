import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';
import { rateLimit } from '@/lib/api/rateLimit';
import { jsonError, jsonOk } from '@/lib/api/http';

const SESSION_COOKIE_NAME = 'nova_session';
const SESSION_EXPIRES_MS = 60 * 60 * 24 * 14 * 1000; // 14 days

// POST /api/auth/session — Create session cookie from Firebase ID token
export async function POST(request: NextRequest) {
    try {
        const rl = await rateLimit(request, { keyPrefix: 'auth_session', max: 10, window: '60 s' });
        if (!rl.ok) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again shortly.' },
                { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
            );
        }

        const { idToken } = await request.json();
        if (!idToken) {
            return jsonError('ID token is required.', 400);
        }

        const sessionCookie = await adminAuth.createSessionCookie(idToken, {
            expiresIn: SESSION_EXPIRES_MS,
        });

        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
            maxAge: SESSION_EXPIRES_MS / 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
        });

        return jsonOk({ status: 'ok' });
    } catch (err: any) {
        return jsonError(err?.message ?? 'Unauthorized', 401);
    }
}

// DELETE /api/auth/session — Clear session cookie on sign-out
export async function DELETE() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    return jsonOk({ status: 'ok' });
}
