import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get('nova_session')?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        const uid = decoded.uid;

        const { amount, accountName, accountNumber, ifsc, bank } = await request.json();
        const withdrawAmount = parseFloat(amount);
        if (isNaN(withdrawAmount) || withdrawAmount < 100) {
            return NextResponse.json({ error: 'Invalid amount. Min ₹100 required.' }, { status: 400 });
        }

        const walletSnap = await adminDb.collection('wallets').where('user_id', '==', uid).get();
        if (walletSnap.empty) {
            return NextResponse.json({ error: 'Wallet not found.' }, { status: 404 });
        }

        const walletRef = walletSnap.docs[0].ref;
        const walletData = walletSnap.docs[0].data();

        if (walletData.balance < withdrawAmount) {
            return NextResponse.json({ error: 'Insufficient balance.' }, { status: 400 });
        }

        // Add or update bank account
        const accSnap = await adminDb.collection('bank_accounts')
            .where('user_id', '==', uid)
            .where('account_number', '==', accountNumber)
            .get();

        if (accSnap.empty) {
            await adminDb.collection('bank_accounts').add({
                user_id: uid,
                account_name: accountName,
                account_number: accountNumber,
                ifsc_code: ifsc,
                bank_name: bank,
                created_at: FieldValue.serverTimestamp()
            });
        }

        // Transaction block
        const batch = adminDb.batch();

        // 1. Withdraw transacton
        const txRef = adminDb.collection('transactions').doc();
        batch.set(txRef, {
            wallet_id: walletSnap.docs[0].id,
            type: 'debit',
            amount: withdrawAmount,
            description: `Withdrawal to ${bank} ****${accountNumber.slice(-4)}`,
            reference_type: 'withdrawal',
            status: 'pending',
            created_at: FieldValue.serverTimestamp()
        });

        // 2. Decrement wallet balance
        batch.update(walletRef, {
            balance: FieldValue.increment(-withdrawAmount),
            total_withdrawn: FieldValue.increment(withdrawAmount)
        });

        await batch.commit();

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
