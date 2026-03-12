import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get('nova_session')?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        await adminAuth.verifySessionCookie(sessionCookie, true);

        const { searchParams } = new URL(request.url);
        const tab = searchParams.get('tab') || 'sponsorships';

        if (tab === 'sponsorships') {
            const snap = await adminDb.collection('campaigns')
                .where('status', '==', 'active')
                .limit(40)
                .get();
                
            const campaigns = await Promise.all(snap.docs.map(async d => {
                const data = d.data();
                let brandProfiles = { brand_name: 'Brand', logo_url: '', verification_status: 'unverified' };
                try {
                    const bDoc = await adminDb.collection('brand_profiles').doc(data.brand_id).get();
                    if (bDoc.exists) brandProfiles = bDoc.data() as any;
                } catch {}
                return {
                    id: d.id,
                    ...data,
                    brand_profiles: brandProfiles,
                    created_at: data.created_at?.toDate?.()?.toISOString() ?? new Date().toISOString()
                };
            }));

            campaigns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            return NextResponse.json({ campaigns: campaigns.slice(0, 20) });

        } else {
            const snap = await adminDb.collection('gigs')
                .where('status', '==', 'active')
                .limit(40)
                .get();

            const gigs = await Promise.all(snap.docs.map(async d => {
                const data = d.data();
                let params = { name: 'basic', price: 0, delivery_days: 1 };
                try {
                    const pkgs = await adminDb.collection('gig_packages').where('gig_id', '==', d.id).get();
                    if (!pkgs.empty) params = pkgs.docs[0].data() as any;
                } catch {}

                let creator = { social_score: 0, users: { full_name: 'Creator', avatar_url: '' } };
                try {
                    const cpDoc = await adminDb.collection('creator_profiles').doc(data.creator_id).get();
                    if (cpDoc.exists) {
                        creator.social_score = cpDoc.data()?.social_score ?? 0;
                        const uDoc = await adminDb.collection('users').doc(data.creator_id).get();
                        if (uDoc.exists) creator.users = uDoc.data() as any;
                    }
                } catch {}

                return {
                    id: d.id,
                    ...data,
                    gig_packages: [params], // For UI simplicity
                    creator_profiles: creator
                };
            }));

            gigs.sort((a, b) => ((b as any).total_orders || 0) - ((a as any).total_orders || 0));
            return NextResponse.json({ gigs: gigs.slice(0, 20) });
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get('nova_session')?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        const uid = decoded.uid;

        const body = await request.json();

        const doc = await adminDb.collection('brand_profiles').doc(uid).get();
        if (!doc.exists) {
            return NextResponse.json({ error: 'Brand profile not found.' }, { status: 403 });
        }

        const campaignRef = await adminDb.collection('campaigns').add({
            brand_id: uid,
            title: body.title,
            description: body.description,
            campaign_type: body.campaign_type,
            status: 'active',
            budget_min: body.budget_min ?? null,
            budget_max: body.budget_max ?? null,
            barter_details: body.barter_details ?? null,
            platforms: body.platforms ?? [],
            target_niches: body.target_niches ?? [],
            deliverables: body.deliverables ?? [],
            min_followers: body.min_followers ?? null,
            min_social_score: body.min_social_score ?? null,
            max_creators: body.max_creators ?? 1,
            deadline: body.deadline ?? null,
            created_at: FieldValue.serverTimestamp()
        });

        return NextResponse.json({ success: true, id: campaignRef.id });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
