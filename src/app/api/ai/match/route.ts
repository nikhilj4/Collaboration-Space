import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// POST /api/ai/match — AI creator-brand matching
export async function POST(request: Request) {
    try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { campaign_id } = await request.json();

        // Get campaign details
        const { data: campaign } = await supabase.from('campaigns')
            .select('*').eq('id', campaign_id).single();
        if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

        // Get potential creators
        const { data: creators } = await supabase.from('creator_profiles')
            .select(`id, social_score, categories, users(full_name, username),
        social_accounts(platform, followers_count, engagement_rate)`)
            .gte('social_score', campaign.min_social_score ?? 0)
            .overlaps('categories', campaign.target_niches ?? [])
            .limit(50);

        if (!creators || creators.length === 0) {
            return NextResponse.json({ matches: [] });
        }

        const prompt = `You are an influencer marketing AI. Match creators to a campaign.
Campaign: ${JSON.stringify({ title: campaign.title, niches: campaign.target_niches, type: campaign.campaign_type, budget: `${campaign.budget_min}-${campaign.budget_max}` })}
Creators: ${JSON.stringify(creators.slice(0, 20).map(c => ({ id: c.id, score: c.social_score, categories: c.categories })))}
Return JSON array of top 10 creator IDs ranked by fit score 0-100: [{"id":"...","fit_score":85,"reason":"..."}]`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            max_tokens: 500,
        });

        const result = JSON.parse(completion.choices[0].message.content ?? '{"matches":[]}');

        // Save recommendations
        if (result.matches?.length) {
            await supabase.from('ai_recommendations').insert(
                result.matches.map((m: { id: string; fit_score: number; reason: string }) => ({
                    user_id: user.id,
                    type: 'creator_for_brand',
                    payload: m,
                    score: m.fit_score,
                }))
            );
        }

        return NextResponse.json({ matches: result.matches ?? [] });
    } catch (err) {
        console.error('[AI MATCH ERROR]', err);
        return NextResponse.json({ error: 'AI matching failed' }, { status: 500 });
    }
}
