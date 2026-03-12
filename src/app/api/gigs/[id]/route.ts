import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const sessionCookie = request.cookies.get('nova_session')?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        await adminAuth.verifySessionCookie(sessionCookie, true);

        const gigId = params.id;

        // Fetch gig
        const docRef = adminDb.collection('gigs').doc(gigId);
        const doc = await docRef.get();
        if (!doc.exists) return NextResponse.json({ error: 'Gig not found' }, { status: 404 });

        const data = doc.data()!;

        // Increment views
        try {
            await docRef.update({ views_count: FieldValue.increment(1) });
            data.views_count = (data.views_count || 0) + 1;
        } catch {}

        // Fetch packages
        let packages: any[] = [];
        try {
            const pkgsSnap = await adminDb.collection('gig_packages').where('gig_id', '==', gigId).get();
            packages = pkgsSnap.docs.map(d => d.data());
        } catch {}

        // Fetch creator
        let creator = { bio: '', social_score: 0, users: { full_name: 'Creator', username: '', avatar_url: '' }, id: data.creator_id };
        try {
            const cDoc = await adminDb.collection('creator_profiles').doc(data.creator_id).get();
            if (cDoc.exists) {
                creator.bio = cDoc.data()!.bio || '';
                creator.social_score = cDoc.data()!.social_score || 0;
            }
            const uDoc = await adminDb.collection('users').doc(data.creator_id).get();
            if (uDoc.exists) creator.users = uDoc.data() as any;
        } catch {}

        const gig = {
            id: doc.id,
            title: data.title || '',
            description: data.description || '',
            category: data.category || '',
            tags: data.tags || [],
            media_urls: data.media_urls || [],
            views_count: data.views_count,
            orders_count: data.orders_count || 0,
            rating_avg: data.rating_avg || 0,
            rating_count: data.rating_count || 0,
            packages,
            creator_profiles: creator
        };

        return NextResponse.json({ gig });
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

        const gigId = params.id;
        const { package_name, price, delivery_days, seller_id } = await request.json();

        const orderRef = await adminDb.collection('gig_orders').add({
            gig_id: gigId,
            buyer_id: uid,
            seller_id: seller_id,
            package_name,
            amount: price,
            status: 'pending',
            payment_status: 'pending',
            delivery_deadline: new Date(Date.now() + delivery_days * 86400000).toISOString(),
            requirements: '',
            created_at: FieldValue.serverTimestamp()
        });

        return NextResponse.json({ success: true, orderId: orderRef.id });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
