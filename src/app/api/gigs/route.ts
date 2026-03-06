import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// GET /api/gigs — list/search gigs
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const minScore = searchParams.get('min_score');
    const maxPrice = searchParams.get('max_price');
    const platform = searchParams.get('platform');
    const q = searchParams.get('q');
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);
    const offset = (page - 1) * limit;

    const supabase = await createClient();
    let query = supabase.from('gigs')
        .select(`*, creator_profiles!inner(social_score, user_id, users!inner(username, full_name, avatar_url)),
      gig_packages(name, price, delivery_days), gig_portfolio(media_url)`)
        .eq('status', 'active')
        .order('creator_profiles.social_score', { ascending: false })
        .range(offset, offset + limit - 1);

    if (category) query = query.eq('category', category);
    if (platform) query = query.contains('platforms', [platform]);
    if (q) query = query.textSearch('title', q);

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data, count, page, limit });
}

// POST /api/gigs — create gig
const gigSchema = z.object({
    title: z.string().min(10).max(100),
    description: z.string().min(30).max(2000),
    platforms: z.array(z.string()).min(1),
    content_types: z.array(z.string()).min(1),
    category: z.string(),
    tags: z.array(z.string()).max(10).optional(),
    packages: z.array(z.object({
        name: z.enum(['basic', 'standard', 'premium']),
        description: z.string().optional(),
        price: z.number().min(100),
        deliverables: z.array(z.string()),
        delivery_days: z.number().min(1).max(90),
        revisions: z.number().min(0).max(10),
    })).min(1).max(3),
});

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { packages, ...gigData } = gigSchema.parse(body);

        // Get creator profile
        const { data: creator } = await supabase.from('creator_profiles').select('id').eq('user_id', user.id).single();
        if (!creator) return NextResponse.json({ error: 'Creator profile required' }, { status: 400 });

        const { data: gig, error: gigErr } = await supabase.from('gigs')
            .insert({ ...gigData, creator_id: creator.id }).select().single();
        if (gigErr) return NextResponse.json({ error: gigErr.message }, { status: 500 });

        // Insert packages
        const { error: pkgErr } = await supabase.from('gig_packages')
            .insert(packages.map(p => ({ ...p, gig_id: gig.id })));
        if (pkgErr) return NextResponse.json({ error: pkgErr.message }, { status: 500 });

        return NextResponse.json({ data: gig }, { status: 201 });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: err.issues[0].message }, { status: 422 });
        }
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
