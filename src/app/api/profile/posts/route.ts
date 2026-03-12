import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get('nova_session')?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        await adminAuth.verifySessionCookie(sessionCookie, true);

        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');
        if (!uid) return NextResponse.json({ error: 'uid required.' }, { status: 400 });

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

        return NextResponse.json({ posts });
    } catch (err: any) {
        console.error('Profile posts error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
