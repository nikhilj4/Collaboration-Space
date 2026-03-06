// Run with: node scripts/create-admin.mjs
// Creates a test admin user with email already confirmed (no email verification needed)

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Read .env.local manually
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, '../.env.local');
const env = Object.fromEntries(
    readFileSync(envPath, 'utf8')
        .split('\n')
        .filter(l => l && !l.startsWith('#'))
        .map(l => l.split('=').map(p => p.trim()))
        .filter(([k]) => k)
        .map(([k, ...v]) => [k, v.join('=')])
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || SUPABASE_URL.includes('YOUR_')) {
    console.error('❌  Missing Supabase keys in .env.local');
    process.exit(1);
}

// Admin credentials — change these if you want
const ADMIN_EMAIL = 'admin@novalogic.dev';
const ADMIN_PASSWORD = 'Admin@1234';
const ADMIN_NAME = 'Admin User';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
    console.log('Creating admin user…');

    // 1 — Create auth user with email confirmed
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,  // ← skips email verification
        user_metadata: { full_name: ADMIN_NAME, role: 'creator' },
    });

    if (authErr) {
        console.error('❌  Auth error:', authErr.message);
        process.exit(1);
    }

    const userId = authData.user.id;
    console.log('✅  Auth user created:', userId);

    // 2 — Upsert into public.users (trigger may have already done this)
    const { error: userErr } = await supabase.from('users').upsert({
        id: userId,
        email: ADMIN_EMAIL,
        full_name: ADMIN_NAME,
        username: 'admin',
        role: 'creator',
        status: 'active',
        email_verified: true,
        onboarding_completed: true,
    }, { onConflict: 'id' });

    if (userErr) console.warn('⚠️  users upsert (may already exist):', userErr.message);

    // 3 — Create creator profile so onboarding is skipped
    const { error: cpErr } = await supabase.from('creator_profiles').upsert({
        user_id: userId,
        bio: 'Nova Logic Admin',
        categories: ['Tech'],
        social_score: 100,
    }, { onConflict: 'user_id' });

    if (cpErr) console.warn('⚠️  creator_profiles:', cpErr.message);

    console.log('\n🎉  Done! Login at http://localhost:3000/auth/login');
    console.log('   Email   :', ADMIN_EMAIL);
    console.log('   Password:', ADMIN_PASSWORD);
}

main();
