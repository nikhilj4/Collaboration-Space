import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get('nova_session')?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        }

        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        const uid = decoded.uid;

        const body = await request.json();
        const { caption, hashtags, media_urls, media_type } = body;

        if (!caption?.trim() && (!media_urls || media_urls.length === 0)) {
            return NextResponse.json({ error: 'Add a caption or media.' }, { status: 400 });
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

        return NextResponse.json({ id: postRef.id }, { status: 201 });
    } catch (err: any) {
        console.error('Post create error:', err);
        return NextResponse.json({ error: err.message ?? 'Failed to create post.' }, { status: 500 });
    }
}
