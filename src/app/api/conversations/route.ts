import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get('nova_session')?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        const uid = decoded.uid;

        const [snap1, snap2] = await Promise.all([
            adminDb.collection('conversations').where('participant_1', '==', uid).get(),
            adminDb.collection('conversations').where('participant_2', '==', uid).get()
        ]);

        const uniqueConvs = new Map();
        [...snap1.docs, ...snap2.docs].forEach(d => uniqueConvs.set(d.id, { id: d.id, ...d.data() }));

        const conversations = await Promise.all(Array.from(uniqueConvs.values()).map(async (c: any) => {
            const otherId = c.participant_1 === uid ? c.participant_2 : c.participant_1;
            let other_user = { full_name: 'Unknown', username: '', avatar_url: '' };
            try {
                const uDoc = await adminDb.collection('users').doc(otherId).get();
                if (uDoc.exists) other_user = uDoc.data() as any;
            } catch {}
            return {
                ...c,
                other_user,
                last_message_at: c.last_message_at?.toDate?.()?.toISOString() ?? c.last_message_at ?? null,
            };
        }));

        conversations.sort((a, b) => {
            if (!a.last_message_at) return 1;
            if (!b.last_message_at) return -1;
            return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
        });

        return NextResponse.json({ conversations });
    } catch (err: any) {
        console.error('Conversations error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
