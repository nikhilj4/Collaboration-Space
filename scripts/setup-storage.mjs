// Run once: node scripts/setup-storage.mjs
// Creates the 'media' bucket in Supabase Storage with public access

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, '../.env.local');
const env = Object.fromEntries(
    readFileSync(envPath, 'utf8').split('\n').filter(l => l && !l.startsWith('#'))
        .map(l => l.split('=').map(p => p.trim())).filter(([k]) => k).map(([k, ...v]) => [k, v.join('=')])
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
    // Create public media bucket
    const { error: be } = await supabase.storage.createBucket('media', {
        public: true,
        allowedMimeTypes: ['image/*', 'video/*'],
        fileSizeLimit: 52428800, // 50 MB
    });
    if (be && !be.message.includes('already exists')) { console.error('❌ Bucket:', be.message); return; }
    console.log('✅ media bucket ready');

    // Create avatars bucket
    const { error: ae } = await supabase.storage.createBucket('avatars', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 5242880, // 5 MB
    });
    if (ae && !ae.message.includes('already exists')) { console.error('❌ Avatars:', ae.message); return; }
    console.log('✅ avatars bucket ready');

    console.log('\n🎉 Storage setup complete — uploads will work now.');
}

main();
