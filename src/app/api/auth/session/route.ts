import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'nova_session';
const SESSION_EXPIRES_MS = 60 * 60 * 24 * 14 * 1000; // 14 days

// POST /api/auth/session — Create session cookie from Firebase ID token
export async function POST(request: NextRequest) {
    try {
        const { idToken } = await request.json();
        if (!idToken) {
            return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
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

        return NextResponse.json({ status: 'ok' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 401 });
    }
}

// DELETE /api/auth/session — Clear session cookie on sign-out
export async function DELETE() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    return NextResponse.json({ status: 'ok' });
}
