import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { AuthError, requireSession } from '@/lib/api/auth';
import { rateLimit } from '@/lib/api/rateLimit';
import { jsonCreated, jsonError } from '@/lib/api/http';

export async function POST(request: NextRequest) {
    try {
        const rl = await rateLimit(request, { keyPrefix: 'posts_create', max: 20, window: '60 s' });
        if (!rl.ok) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again shortly.' },
                { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
            );
        }

        const decoded = await requireSession(request);
        const uid = decoded.uid;

        const body = await request.json();
        const { caption, hashtags, media_urls, media_type } = body;

        if (!caption?.trim() && (!media_urls || media_urls.length === 0)) {
            return jsonError('Add a caption or media.', 400);
        }

        const postRef = await adminDb.collection('posts').add({
            user_id: uid,
            caption: caption?.trim() ?? '',
            hashtags: hashtags ?? [],
            media_urls: media_urls ?? [],
            media_type: media_type ?? 'image',
            likes: 0,
            comments: 0,
            created_at: FieldValue.serverTimestamp(),
        });

        return jsonCreated({ id: postRef.id });
    } catch (err: any) {
        if (err instanceof AuthError) return jsonError(err.message, err.status, { code: err.code });
        console.error('Post create error:', err);
        return jsonError(err?.message ?? 'Failed to create post.', 500);
    }
}
