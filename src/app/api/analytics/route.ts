import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get('nova_session')?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        const uid = decoded.uid;

        // Fetch history
        const histSnap = await adminDb
            .collection('social_score_history')
            .where('creator_id', '==', uid)
            .get();

        const history = histSnap.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                calculated_at: data.calculated_at?.toDate?.()?.toISOString() ?? null,
            };
        }).sort((a: any, b: any) => {
            if (!a.calculated_at) return -1;
            if (!b.calculated_at) return 1;
            return new Date(a.calculated_at).getTime() - new Date(b.calculated_at).getTime();
        }).slice(0, 12);

        // Fetch accounts
        const acctSnap = await adminDb
            .collection('social_accounts')
            .where('creator_id', '==', uid)
            .get();

        const accounts = acctSnap.docs.map(d => ({
            platform: d.data().platform,
            followers_count: d.data().followers_count ?? 0,
            engagement_rate: d.data().engagement_rate ?? 0,
            avg_likes: d.data().avg_likes ?? 0,
            avg_comments: d.data().avg_comments ?? 0,
            reach_estimate: d.data().reach_estimate ?? 0,
        }));

        return NextResponse.json({ history, accounts });
    } catch (err: any) {
        console.error('Analytics error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
