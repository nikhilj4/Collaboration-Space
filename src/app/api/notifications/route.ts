import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get('nova_session')?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        const uid = decoded.uid;

        const { searchParams } = new URL(request.url);
        const tab = searchParams.get('tab') ?? 'all';

        let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = adminDb.collection('notifications').where('user_id', '==', uid);

        if (tab === 'sponsorship') {
            query = query.where('type', 'in', ['campaign_invite', 'payment']);
        } else if (tab === 'social') {
            query = query.where('type', 'in', ['follow', 'like', 'comment']);
        }

        const snap = await query.get();

        const notifs = snap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            created_at: d.data().created_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50);

        return NextResponse.json({ notifications: notifs });
    } catch (err: any) {
        console.error('Notifications error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get('nova_session')?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        const uid = decoded.uid;

        const { action, id } = await request.json();

        if (action === 'read_one' && id) {
            await adminDb.collection('notifications').doc(id).update({ read_at: new Date().toISOString() });
        } else if (action === 'read_all') {
            const snap = await adminDb.collection('notifications')
                .where('user_id', '==', uid)
                .where('read_at', '==', null)
                .get();
            
            const batch = adminDb.batch();
            const now = new Date().toISOString();
            snap.docs.forEach(d => {
                batch.update(d.ref, { read_at: now });
            });
            if (snap.docs.length > 0) {
                await batch.commit();
            }
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
