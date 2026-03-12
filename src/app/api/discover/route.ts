import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get('nova_session')?.value;
        if (!sessionCookie) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        await adminAuth.verifySessionCookie(sessionCookie, true);

        const { searchParams } = new URL(request.url);
        const niche = searchParams.get('niche') ?? 'All';

        let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = adminDb.collection('creator_profiles');

        if (niche !== 'All') {
            query = query.where('categories', 'array-contains', niche);
        }

        const snap = await query.limit(50).get();

        const creators = await Promise.all(snap.docs.map(async d => {
            const data = d.data();
            const creatorId = d.id;

            let userObj = { full_name: 'Creator', username: '', avatar_url: '' };
            try {
                const userDoc = await adminDb.collection('users').doc(creatorId).get();
                if (userDoc.exists) userObj = userDoc.data() as any;
            } catch {}

            let accounts: any[] = [];
            try {
                const acctSnap = await adminDb.collection('social_accounts').where('creator_id', '==', creatorId).get();
                accounts = acctSnap.docs.map(a => a.data());
            } catch {}

            return {
                id: creatorId,
                social_score: data.social_score ?? 0,
                categories: data.categories ?? [],
                users: userObj,
                social_accounts: accounts
            };
        }));

        creators.sort((a, b) => b.social_score - a.social_score);

        return NextResponse.json({ creators: creators.slice(0, 30) });
    } catch (err: any) {
        console.error('Discover error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
