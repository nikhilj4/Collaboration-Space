import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'nova_session';

const PUBLIC_PATHS = [
    '/auth/login',
    '/auth/signup',
    '/auth/verify',
    '/api/auth/signup',
    '/api/auth/session',
];

// Middleware runs in Edge Runtime — we only check cookie presence here.
// Full token verification happens in individual API/page route handlers via firebase-admin.
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Always allow public paths and static assets
    if (
        PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.startsWith('/api/')
    ) {
        return NextResponse.next();
    }

    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Cookie exists — allow through. Pages/API routes do full token verification.
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
