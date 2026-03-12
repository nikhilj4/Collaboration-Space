import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const sessionCookie = request.cookies.get('nova_session')?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        await adminAuth.verifySessionCookie(sessionCookie, true);

        const postId = params.id;

        const [postDoc, commentsSnap] = await Promise.all([
            adminDb.collection('posts').doc(postId).get(),
            adminDb.collection('post_comments').where('post_id', '==', postId).get()
        ]);

        if (!postDoc.exists) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });

        let postAuthor = { full_name: 'Unknown', username: '', avatar_url: '' };
        try {
            const udoc = await adminDb.collection('users').doc((postDoc.data() as any).user_id).get();
            if (udoc.exists) postAuthor = udoc.data() as any;
        } catch {}

        const post = { id: postDoc.id, ...postDoc.data(), users: postAuthor };

        const comments = await Promise.all(commentsSnap.docs.map(async d => {
            const cdata = d.data();
            let cauthor = { full_name: 'Unknown', username: '', avatar_url: '' };
            try {
                const cudoc = await adminDb.collection('users').doc(cdata.user_id).get();
                if (cudoc.exists) cauthor = cudoc.data() as any;
            } catch {}
            return {
                id: d.id,
                ...cdata,
                users: cauthor,
                created_at: cdata.created_at?.toDate?.()?.toISOString() ?? new Date().toISOString()
            };
        }));

        comments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        return NextResponse.json({ post, comments });
    } catch (err: any) {
        console.error('Comments error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const sessionCookie = request.cookies.get('nova_session')?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        const uid = decoded.uid;

        const postId = params.id;
        const { content } = await request.json();

        if (!content?.trim()) return NextResponse.json({ error: 'Comment empty.' }, { status: 400 });

        const newCommentRef = await adminDb.collection('post_comments').add({
            post_id: postId,
            user_id: uid,
            content: content.trim(),
            likes_count: 0,
            created_at: FieldValue.serverTimestamp()
        });

        // Increment post comments count
        const postRef = adminDb.collection('posts').doc(postId);
        await adminDb.runTransaction(async (t) => {
            const doc = await t.get(postRef);
            if (doc.exists) {
                t.update(postRef, { comments: (doc.data()?.comments || 0) + 1 });
            }
        });

        return NextResponse.json({ id: newCommentRef.id });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
