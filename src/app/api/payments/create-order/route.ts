import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
    try {
        const { amount, currency = 'INR', gigOrderId, notes } = await req.json();

        if (!amount || amount < 100) {
            return NextResponse.json({ error: 'Minimum amount is ₹1 (100 paise)' }, { status: 400 });
        }

        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100), // paise
            currency,
            receipt: `order_${gigOrderId ?? Date.now()}`,
            notes: notes ?? {},
        });

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
        });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to create Razorpay order';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
