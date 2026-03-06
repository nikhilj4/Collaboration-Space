import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, gigOrderId, buyerId, sellerId, amount } = await req.json();

        // Verify signature
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSig = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(body).digest('hex');

        if (expectedSig !== razorpay_signature) {
            return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
        }

        // Update gig order status
        if (gigOrderId) {
            await supabase.from('gig_orders').update({
                status: 'in_progress',
                payment_id: razorpay_payment_id,
                payment_status: 'paid',
            }).eq('id', gigOrderId);
        }

        // Escrow: hold funds in buyer wallet
        const { data: wallet } = await supabase.from('wallets').select('id, balance').eq('user_id', buyerId).single();
        if (wallet) {
            await supabase.from('transactions').insert({
                wallet_id: wallet.id,
                type: 'escrow_hold',
                amount,
                description: `Escrow for order ${gigOrderId}`,
                reference_id: razorpay_payment_id,
                reference_type: 'payment',
                status: 'completed',
            });
        }

        return NextResponse.json({ success: true, paymentId: razorpay_payment_id });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Verification failed';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
