import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
    bio: z.string().max(500).optional(),
    location: z.string().max(100).optional(),
    categories: z.array(z.string()).max(5).optional(),
    languages: z.array(z.string()).optional(),
    website: z.string().url().optional().or(z.literal('')),
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const supabase = await createClient();

    const query = supabase.from('creator_profiles')
        .select(`*, users!inner(id, username, full_name, avatar_url, status),
      social_accounts(platform, handle, followers_count, engagement_rate, verified)`)
        .eq('users.status', 'active');

    if (username) {
        query.eq('users.username', username);
    }

    const { data, error } = await query.limit(20);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const updates = schema.parse(body);

        const { data, error } = await supabase.from('creator_profiles')
            .upsert({ user_id: user.id, ...updates }, { onConflict: 'user_id' })
            .select().single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ data });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: err.issues[0].message }, { status: 422 });
        }
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
