import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { AuthError, requireSession } from '@/lib/api/auth';
import { rateLimit } from '@/lib/api/rateLimit';
import { jsonError, jsonOk } from '@/lib/api/http';

export async function GET(request: NextRequest) {
    try {
        const rl = await rateLimit(request, { keyPrefix: 'feed_get', max: 60, window: '60 s' });
        if (!rl.ok) {
            return NextResponse.json(
                { error: 'Too many requests. Please slow down.' },
                { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
            );
        }

        const decoded = await requireSession(request);
        const uid = decoded.uid;

        const { searchParams } = new URL(request.url);
        const tab = searchParams.get('tab') ?? 'foryou'; // 'foryou' | 'following'

        let postDocs;

        if (tab === 'following') {
            const followSnap = await adminDb
                .collection('follows')
                .where('follower_id', '==', uid)
                .get();
            const followingIds = followSnap.docs.map(d => d.data().following_id as string);

            if (followingIds.length === 0) {
                return NextResponse.json({ posts: [] });
            }

            postDocs = await adminDb
                .collection('posts')
                .where('user_id', 'in', followingIds.slice(0, 30))
                .get();
        } else {
            // For You — all posts, no orderBy (avoids composite index requirement)
            postDocs = await adminDb
                .collection('posts')
                .limit(50)
                .get();
        }

        // Enrich posts with user data
        const posts = await Promise.all(
            postDocs.docs.map(async (postDoc) => {
                const post = { id: postDoc.id, ...postDoc.data() };
                const userId = (post as any).user_id;

                // Fetch author user doc
                let author = { full_name: 'Unknown', username: '', avatar_url: '' };
                try {
                    const userDoc = await adminDb.collection('users').doc(userId).get();
                    if (userDoc.exists) {
                        const d = userDoc.data()!;
                        author = {
                            full_name: d.full_name ?? 'Unknown',
                            username: d.username ?? '',
                            avatar_url: d.avatar_url ?? '',
                        };
                    }
                } catch { }

                // Fetch like/save status for current user
                const likeDoc = await adminDb
                    .collection('post_likes')
                    .doc(`${postDoc.id}_${uid}`)
                    .get();
                const saveDoc = await adminDb
                    .collection('post_saves')
                    .doc(`${postDoc.id}_${uid}`)
                    .get();

                return {
                    ...post,
                    users: author,
                    liked_by_me: likeDoc.exists,
                    saved_by_me: saveDoc.exists,
                    created_at: (post as any).created_at?.toDate?.()?.toISOString() ?? null,
                };
            })
        );

        // Sort newest first in memory (avoids Firestore composite index)
        const sorted = posts
            .sort((a: any, b: any) => {
                if (!a.created_at) return 1;
                if (!b.created_at) return -1;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            })
            .slice(0, 20);

        return jsonOk({ posts: sorted });
    } catch (err: any) {
        if (err instanceof AuthError) return jsonError(err.message, err.status, { code: err.code });
        console.error('Feed error:', err);
        return jsonError(err?.message ?? 'Failed to load feed.', 500);
    }
}

// Toggle like
export async function POST(request: NextRequest) {
    try {
        const rl = await rateLimit(request, { keyPrefix: 'feed_post', max: 120, window: '60 s' });
        if (!rl.ok) {
            return NextResponse.json(
                { error: 'Too many requests. Please slow down.' },
                { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
            );
        }

        const decoded = await requireSession(request);
        const uid = decoded.uid;

        const { post_id, action } = await request.json(); // action: 'like' | 'unlike' | 'save' | 'unsave'
        if (!post_id || !action) return jsonError('post_id and action are required.', 400);

        const likeRef = adminDb.collection('post_likes').doc(`${post_id}_${uid}`);
        const saveRef = adminDb.collection('post_saves').doc(`${post_id}_${uid}`);
        const postRef = adminDb.collection('posts').doc(post_id);

        if (action === 'like') {
            await likeRef.set({ post_id, user_id: uid });
            await postRef.update({ likes: (await postRef.get()).data()?.likes + 1 || 1 });
        } else if (action === 'unlike') {
            await likeRef.delete();
            const cur = (await postRef.get()).data()?.likes ?? 1;
            await postRef.update({ likes: Math.max(0, cur - 1) });
        } else if (action === 'save') {
            await saveRef.set({ post_id, user_id: uid });
        } else if (action === 'unsave') {
            await saveRef.delete();
        } else {
            return jsonError('Invalid action.', 400);
        }

        return jsonOk({ success: true });
    } catch (err: any) {
        if (err instanceof AuthError) return jsonError(err.message, err.status, { code: err.code });
        return jsonError(err?.message ?? 'Request failed.', 500);
    }
}
