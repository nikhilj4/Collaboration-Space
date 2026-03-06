import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import Razorpay from 'razorpay';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const PLATFORM_FEE_RATE = 0.15; // 15% platform commission
const GST_RATE = 0.18; // 18% GST on platform fee

// POST /api/orders — initiate gig order + create Razorpay order
export async function POST(request: Request) {
    try {
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { package_id, requirements } = await request.json();
        if (!package_id) return NextResponse.json({ error: 'package_id required' }, { status: 400 });

        // Get package details
        const { data: pkg } = await supabase.from('gig_packages')
            .select('*, gigs(creator_id, creator_profiles(user_id))')
            .eq('id', package_id).single();
        if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 });

        const amount = pkg.price;
        const platformFee = amount * PLATFORM_FEE_RATE;
        const gstOnFee = platformFee * GST_RATE;
        const totalAmount = amount + platformFee + gstOnFee;
        const sellerEarning = amount - platformFee;

        // Create Razorpay order
        const rzpOrder = await razorpay.orders.create({
            amount: Math.round(totalAmount * 100), // paise
            currency: 'INR',
            notes: { gig_id: pkg.gig_id, package_id, buyer_id: user.id },
        });

        // Save pending order
        const { data: order, error } = await supabase.from('gig_orders').insert({
            gig_id: pkg.gig_id,
            package_id,
            buyer_id: user.id,
            seller_id: (pkg.gigs as any)?.creator_profiles?.user_id,
            requirements,
            amount,
            platform_fee: platformFee + gstOnFee,
            seller_earning: sellerEarning,
            payment_id: rzpOrder.id,
            status: 'pending',
            payment_status: 'pending',
        }).select().single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({
            order_id: order.id,
            razorpay_order_id: rzpOrder.id,
            amount: totalAmount,
            key: process.env.RAZORPAY_KEY_ID,
        });
    } catch (err) {
        console.error('[ORDER ERROR]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST /api/orders/verify-payment
export async function PUT(request: Request) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = await request.json();

        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSig = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(body).digest('hex');

        if (expectedSig !== razorpay_signature) {
            return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
        }

        const supabase = await createClient();
        await supabase.from('gig_orders').update({
            payment_status: 'escrow',
            status: 'accepted',
            payment_id: razorpay_payment_id,
        }).eq('id', order_id);

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}
