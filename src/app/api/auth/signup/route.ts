import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
    try {
        const { email, password, full_name, role } = await request.json();

        if (!email || !password || !full_name || !role) {
            return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
        }

        // Create user in Firebase Auth
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: full_name,
        });

        // Create Firestore user doc
        await adminDb.collection('users').doc(userRecord.uid).set({
            email,
            full_name,
            role,
            onboarding_completed: false,
            created_at: new Date().toISOString(),
        });

        // Create empty role-specific profile
        if (role === 'creator') {
            await adminDb.collection('creator_profiles').doc(userRecord.uid).set({
                social_score: 0,
                categories: [],
                created_at: new Date().toISOString(),
            });
        } else {
            await adminDb.collection('brand_profiles').doc(userRecord.uid).set({
                brand_name: full_name,
                created_at: new Date().toISOString(),
            });
        }

        // Create a custom token for immediate sign-in on the client
        const customToken = await adminAuth.createCustomToken(userRecord.uid);

        return NextResponse.json({ customToken }, { status: 201 });
    } catch (err: any) {
        const msg: Record<string, string> = {
            'auth/email-already-exists': 'An account with this email already exists.',
            'auth/invalid-password': 'Password must be at least 6 characters.',
        };
        return NextResponse.json(
            { error: msg[err.code] ?? err.message ?? 'Signup failed.' },
            { status: 400 }
        );
    }
}
