import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get('nova_session')?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        const uid = decoded.uid;

        let wallet = { balance: 0, pending_balance: 0, total_earned: 0, total_withdrawn: 0, id: '' };
        try {
            const wDoc = await adminDb.collection('wallets').where('user_id', '==', uid).get();
            if (!wDoc.empty) {
                wallet = { id: wDoc.docs[0].id, ...(wDoc.docs[0].data() as any) };
            }
        } catch {}

        let txns: any[] = [];
        if (wallet.id) {
            try {
                const txSnap = await adminDb.collection('transactions')
                    .where('wallet_id', '==', wallet.id)
                    .orderBy('created_at', 'desc')
                    .limit(30)
                    .get();
                txns = txSnap.docs.map(d => {
                    const data = d.data();
                    return {
                        id: d.id,
                        ...data,
                        created_at: data.created_at?.toDate?.()?.toISOString() ?? new Date().toISOString()
                    };
                });
            } catch (err) {
                console.error("Txn error: ", err);
            }
        }

        return NextResponse.json({ wallet, txns });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
