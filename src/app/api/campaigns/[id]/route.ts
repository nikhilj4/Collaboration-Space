import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const sessionCookie = request.cookies.get('nova_session')?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        const uid = decoded.uid;
        
        const campaignId = params.id;

        const doc = await adminDb.collection('campaigns').doc(campaignId).get();
        if (!doc.exists) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

        const data = doc.data()!;
        
        let brandProfiles = { company_name: 'Brand', logo_url: '', industry: '' };
        try {
            const bDoc = await adminDb.collection('brand_profiles').doc(data.brand_id).get();
            if (bDoc.exists) brandProfiles = bDoc.data() as any;
        } catch {}

        // Check if current user (creator) has already applied
        let applied = false;
        try {
            const apps = await adminDb.collection('campaign_applications')
                .where('campaign_id', '==', campaignId)
                .where('creator_id', '==', uid)
                .get();
            applied = !apps.empty;
        } catch {}

        const campaign = {
            id: doc.id,
            ...data,
            brand_profiles: brandProfiles,
        };

        return NextResponse.json({ campaign, applied });
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

        const campaignId = params.id;
        const { pitch, proposed_rate } = await request.json();

        // Write application
        await adminDb.collection('campaign_applications').add({
            campaign_id: campaignId,
            creator_id: uid,
            pitch: pitch?.trim() || '',
            proposed_rate: proposed_rate || null,
            status: 'pending',
            created_at: FieldValue.serverTimestamp()
        });

        // Best effort notification to brand
        const campDoc = await adminDb.collection('campaigns').doc(campaignId).get();
        if (campDoc.exists) {
            const brandId = campDoc.data()!.brand_id;
            await adminDb.collection('notifications').add({
                user_id: brandId,
                title: 'New Application',
                body: `A creator applied to "${campDoc.data()!.title}".`,
                type: 'campaign_invite',
                created_at: FieldValue.serverTimestamp()
            });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
