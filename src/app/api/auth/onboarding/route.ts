import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { AuthError, requireSession } from '@/lib/api/auth';
import { rateLimit } from '@/lib/api/rateLimit';
import { jsonError, jsonOk } from '@/lib/api/http';

export async function POST(request: NextRequest) {
    try {
        const rl = await rateLimit(request, { keyPrefix: 'onboarding', max: 15, window: '60 s' });
        if (!rl.ok) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again shortly.' },
                { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
            );
        }

        const decoded = await requireSession(request);
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

        return jsonOk({ success: true });
    } catch (err: any) {
        if (err instanceof AuthError) return jsonError(err.message, err.status, { code: err.code });
        console.error('Onboarding API error:', err);
        return jsonError(err?.message ?? 'Failed to save profile.', 500);
    }
}
