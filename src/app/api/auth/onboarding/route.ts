import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
    try {
        // Verify session cookie
        const sessionCookie = request.cookies.get('nova_session')?.value;
        if (!sessionCookie) {
            return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
        }

        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        const uid = decoded.uid;

        const body = await request.json();
        const { role, username, bio, location, categories, igHandle, ytHandle, ttHandle, brandName, industry, website, brandDesc } = body;

        // 1. Write/merge the user doc — this works even if the doc doesn't exist (Google OAuth users)
        await adminDb.collection('users').doc(uid).set({
            username: username || null,
            email: decoded.email || null,
            full_name: decoded.name || null,
            role: role || 'creator',
            onboarding_completed: true,
            updated_at: FieldValue.serverTimestamp(),
        }, { merge: true });

        // 2. Write role-specific profile
        if (role === 'creator') {
            await adminDb.collection('creator_profiles').doc(uid).set({
                bio: bio || '',
                location: location || '',
                categories: categories || [],
                social_handles: {
                    instagram: igHandle || null,
                    youtube: ytHandle || null,
                    tiktok: ttHandle || null,
                },
                social_score: 0,
                updated_at: FieldValue.serverTimestamp(),
            }, { merge: true });
        } else {
            await adminDb.collection('brand_profiles').doc(uid).set({
                brand_name: brandName || '',
                industry: industry || '',
                website: website || '',
                description: brandDesc || '',
                updated_at: FieldValue.serverTimestamp(),
            }, { merge: true });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Onboarding API error:', err);
        return NextResponse.json({ error: err.message ?? 'Failed to save profile.' }, { status: 500 });
    }
}
