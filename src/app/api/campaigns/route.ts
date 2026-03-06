import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// GET campaigns with filters
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const niche = searchParams.get('niche');
    const minBudget = searchParams.get('min_budget');
    const maxBudget = searchParams.get('max_budget');
    const platform = searchParams.get('platform');
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50);
    const offset = (page - 1) * limit;

    const supabase = await createClient();
    let query = supabase.from('campaigns')
        .select(`*, brand_profiles!inner(brand_name, logo_url, verification_status)`)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (type) query = query.eq('campaign_type', type);
    if (niche) query = query.contains('target_niches', [niche]);
    if (platform) query = query.contains('platforms', [platform]);
    if (minBudget) query = query.gte('budget_min', parseInt(minBudget));
    if (maxBudget) query = query.lte('budget_max', parseInt(maxBudget));

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
}

// POST - create campaign (brands only)
const schema = z.object({
    title: z.string().min(5).max(150),
    description: z.string().min(30).max(3000),
    campaign_type: z.enum(['paid', 'barter', 'hybrid']),
    budget_min: z.number().optional(),
    budget_max: z.number().optional(),
    barter_details: z.string().optional(),
    platforms: z.array(z.string()).min(1),
    content_types: z.array(z.string()).min(1),
    target_niches: z.array(z.string()).min(1),
    target_locations: z.array(z.string()).optional(),
    min_followers: z.number().optional(),
    min_social_score: z.number().optional(),
    deliverables: z.array(z.string()).min(1),
    deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    max_creators: z.number().min(1).max(1000).default(1),
});

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).single();
        if (userRow?.role !== 'brand') return NextResponse.json({ error: 'Brand account required' }, { status: 403 });

        const body = await request.json();
        const campaignData = schema.parse(body);

        const { data: brand } = await supabase.from('brand_profiles').select('id').eq('user_id', user.id).single();
        if (!brand) return NextResponse.json({ error: 'Brand profile required' }, { status: 400 });

        const { data, error } = await supabase.from('campaigns')
            .insert({ ...campaignData, brand_id: brand.id, status: 'active' }).select().single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ data }, { status: 201 });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: err.issues[0].message }, { status: 422 });
        }
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
