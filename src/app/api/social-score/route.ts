import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Social Score Engine
// Formula: (EngagementScore * 0.35) + (ReachScore * 0.25) + (AuthenticityScore * 0.25) + (GrowthScore * 0.15)
// Max score: 1000

function calcEngagementScore(engagementRate: number): number {
    // Benchmark: <1% = low, 1-3% = avg, 3-6% = good, 6%+ = excellent
    if (engagementRate >= 0.1) return 1000;
    if (engagementRate >= 0.06) return 800 + (engagementRate - 0.06) / 0.04 * 200;
    if (engagementRate >= 0.03) return 500 + (engagementRate - 0.03) / 0.03 * 300;
    if (engagementRate >= 0.01) return 200 + (engagementRate - 0.01) / 0.02 * 300;
    return engagementRate / 0.01 * 200;
}

function calcReachScore(followers: number): number {
    if (followers >= 1_000_000) return 1000;
    if (followers >= 100_000) return 700 + (followers - 100_000) / 900_000 * 300;
    if (followers >= 10_000) return 400 + (followers - 10_000) / 90_000 * 300;
    if (followers >= 1_000) return 100 + (followers - 1_000) / 9_000 * 300;
    return followers / 1_000 * 100;
}

function calcAuthenticityScore(authenticity: number): number {
    return Math.min(authenticity * 1000, 1000);
}

function calcGrowthScore(growthRate: number): number {
    if (growthRate >= 0.1) return 1000;
    return Math.min(growthRate / 0.1 * 1000, 1000);
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { creator_id } = await request.json();

        const { data: accounts } = await supabase.from('social_accounts')
            .select('*').eq('creator_id', creator_id);

        if (!accounts || accounts.length === 0) {
            return NextResponse.json({ error: 'No social accounts connected' }, { status: 400 });
        }

        // Aggregate across platforms
        let totalFollowers = 0;
        let weightedEngagement = 0;
        let totalAuthenticity = 0;
        let totalWeight = 0;

        for (const acct of accounts) {
            const weight = acct.followers_count > 0 ? Math.log10(acct.followers_count) : 1;
            totalFollowers += acct.followers_count;
            weightedEngagement += (acct.engagement_rate / 100) * weight;
            totalAuthenticity += (acct.audience_authenticity / 100) * weight;
            totalWeight += weight;
        }

        const avgEngagement = totalWeight > 0 ? weightedEngagement / totalWeight : 0;
        const avgAuthenticity = totalWeight > 0 ? totalAuthenticity / totalWeight : 0;

        const engagementScore = calcEngagementScore(avgEngagement);
        const reachScore = calcReachScore(totalFollowers);
        const authenticityScore = calcAuthenticityScore(avgAuthenticity);
        const growthScore = 500; // placeholder — requires historical data

        const finalScore = Math.round(
            engagementScore * 0.35 +
            reachScore * 0.25 +
            authenticityScore * 0.25 +
            growthScore * 0.15
        );

        const normalizedScore = Math.min(Math.max(Math.round(finalScore / 10), 0), 100);

        // Save score
        await supabase.from('creator_profiles')
            .update({ social_score: normalizedScore }).eq('id', creator_id);

        await supabase.from('social_score_history').insert({
            creator_id,
            score: normalizedScore,
            engagement_score: Math.round(engagementScore / 10),
            reach_score: Math.round(reachScore / 10),
            authenticity_score: Math.round(authenticityScore / 10),
            growth_score: Math.round(growthScore / 10),
        });

        return NextResponse.json({
            score: normalizedScore,
            breakdown: {
                engagement: Math.round(engagementScore / 10),
                reach: Math.round(reachScore / 10),
                authenticity: Math.round(authenticityScore / 10),
                growth: Math.round(growthScore / 10),
            },
        });
    } catch (err) {
        console.error('[SOCIAL SCORE ERROR]', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
