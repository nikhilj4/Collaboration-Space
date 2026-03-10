import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (code) {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && data.user) {
            // Ensure user row exists in users table after email confirmation
            const adminSupabase = await createAdminClient();
            await adminSupabase.from('users').upsert({
                id: data.user.id,
                email: data.user.email,
                full_name: data.user.user_metadata?.full_name ?? '',
                role: data.user.user_metadata?.role ?? 'creator',
                onboarding_completed: false,
            }, { onConflict: 'id', ignoreDuplicates: true });

            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}
