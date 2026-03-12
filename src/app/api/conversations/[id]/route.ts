import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const sessionCookie = request.cookies.get('nova_session')?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        await adminAuth.verifySessionCookie(sessionCookie, true);

        const convId = params.id;

        const snap = await adminDb.collection('messages')
            .where('conversation_id', '==', convId)
            .get();

        const messages = snap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                created_at: data.created_at?.toDate?.()?.toISOString() ?? new Date().toISOString()
            };
        }).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        return NextResponse.json({ messages });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const sessionCookie = request.cookies.get('nova_session')?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        const uid = decoded.uid;

        const convId = params.id;
        const { content } = await request.json();

        if (!content?.trim()) return NextResponse.json({ error: 'Message empty' }, { status: 400 });

        const now = FieldValue.serverTimestamp();

        // 1. Add message
        const msgRef = await adminDb.collection('messages').add({
            conversation_id: convId,
            sender_id: uid,
            content: content.trim(),
            message_type: 'text',
            created_at: now
        });

        // 2. Update conversation
        await adminDb.collection('conversations').doc(convId).update({
            last_message: content.trim(),
            last_message_at: now
        });

        const msgDoc = await msgRef.get();

        return NextResponse.json({
            message: {
                id: msgRef.id,
                ...msgDoc.data(),
                created_at: new Date().toISOString()
            }
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
