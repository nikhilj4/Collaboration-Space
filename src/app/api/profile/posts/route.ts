import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { AuthError, requireSession } from '@/lib/api/auth';
import { rateLimit } from '@/lib/api/rateLimit';
import { jsonError, jsonOk } from '@/lib/api/http';

export async function GET(request: NextRequest) {
    try {
        const rl = await rateLimit(request, { keyPrefix: 'profile_posts', max: 60, window: '60 s' });
        if (!rl.ok) {
            return NextResponse.json(
                { error: 'Too many requests. Please slow down.' },
                { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
            );
        }

        await requireSession(request);

        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');
        if (!uid) return jsonError('uid required.', 400);

        // Fetch posts without orderBy to avoid needing a composite index initially
        const snap = await adminDb
            .collection('posts')
            .where('user_id', '==', uid)
            .get();

        const posts = snap.docs
            .map(d => ({
                id: d.id,
                ...d.data(),
                created_at: d.data().created_at?.toDate?.()?.toISOString() ?? null,
            }))
            // Sort client-side by created_at desc
            .sort((a: any, b: any) => {
                if (!a.created_at) return 1;
                if (!b.created_at) return -1;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            })
            .slice(0, 12);

        return jsonOk({ posts });
    } catch (err: any) {
        if (err instanceof AuthError) return jsonError(err.message, err.status, { code: err.code });
        console.error('Profile posts error:', err);
        return jsonError(err?.message ?? 'Failed to load posts.', 500);
    }
}
