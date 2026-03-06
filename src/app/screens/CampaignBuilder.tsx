'use client';
import { useState } from 'react';
import { Scr } from './types';
import { Icon, P_COLOR as P, BG, BORDER, CARD } from './ui';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';

const inp = {
    width: '100%', background: `${P}0a`, border: `1px solid ${BORDER}`,
    borderRadius: 12, padding: '13px 15px', color: '#eee', fontSize: 14,
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const,
};

const PLATFORMS = ['Instagram', 'YouTube', 'TikTok', 'Twitter / X', 'Facebook'];
const NICHES = ['Fashion', 'Beauty', 'Tech', 'Food', 'Travel', 'Fitness', 'Gaming', 'Lifestyle', 'Finance', 'Education'];

export default function CampaignBuilder({ go }: { go: (s: Scr, id?: string) => void }) {
    const { brandProfile } = useAuthStore() as any;
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Step 1
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [campaignType, setCampaignType] = useState<'paid' | 'barter' | 'hybrid'>('paid');

    // Step 2
    const [platforms, setPlatforms] = useState<string[]>([]);
    const [niches, setNiches] = useState<string[]>([]);
    const [budgetMin, setBudgetMin] = useState('');
    const [budgetMax, setBudgetMax] = useState('');
    const [barterDetails, setBarterDetails] = useState('');

    // Step 3
    const [deliverables, setDeliverables] = useState(['']);
    const [minFollowers, setMinFollowers] = useState('');
    const [minScore, setMinScore] = useState('');
    const [maxCreators, setMaxCreators] = useState('1');
    const [deadline, setDeadline] = useState('');

    function toggle<T>(arr: T[], item: T, set: (v: T[]) => void) {
        set(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]);
    }

    async function submit() {
        setLoading(true); setError('');
        const supabase = createClient();

        const { data: bp } = await supabase.from('brand_profiles').select('id').single();
        if (!bp) { setError('Brand profile not found.'); setLoading(false); return; }

        const { error: err } = await supabase.from('campaigns').insert({
            brand_id: bp.id,
            title, description,
            campaign_type: campaignType,
            status: 'active',
            budget_min: budgetMin ? parseInt(budgetMin) : null,
            budget_max: budgetMax ? parseInt(budgetMax) : null,
            barter_details: barterDetails || null,
            platforms: platforms.map(p => p.toLowerCase().split(' ')[0]),
            target_niches: niches,
            deliverables: deliverables.filter(d => d.trim()),
            min_followers: minFollowers ? parseInt(minFollowers) : null,
            min_social_score: minScore ? parseInt(minScore) : null,
            max_creators: parseInt(maxCreators) || 1,
            deadline: deadline || null,
        });

        if (err) { setError(err.message); setLoading(false); return; }
        setSuccess(true);
        setTimeout(() => go('campaigns'), 1500);
    }

    if (success) {
        return (
            <div style={{ minHeight: '100dvh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <div style={{ fontSize: 56 }}>📣</div>
                <h2 style={{ fontSize: 22, fontWeight: 700 }}>Campaign Live!</h2>
                <p style={{ color: '#888', fontSize: 14 }}>Creators can now discover and apply.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: BG, fontFamily: "'Spline Sans', sans-serif" }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: `1px solid ${BORDER}40` }}>
                <button onClick={() => step > 1 ? setStep(s => s - 1 as 1 | 2 | 3) : go('campaigns')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' }}>
                    <Icon n="arrow_back" style={{ fontSize: 22 }} />
                </button>
                <span style={{ fontWeight: 700, fontSize: 18 }}>Create Campaign</span>
                <span style={{ marginLeft: 'auto', fontSize: 13, color: '#666' }}>{step}/3</span>
            </header>

            {/* Progress */}
            <div style={{ display: 'flex', gap: 4, padding: '12px 16px 0' }}>
                {[1, 2, 3].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i <= step ? P : BORDER, transition: 'background 0.3s' }} />)}
            </div>

            <main style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {step === 1 && (
                    <>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Campaign Details</h2>
                        <div>
                            <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Campaign Title</label>
                            <input style={inp} placeholder="Summer Collection 2025 — Influencer Hunt" value={title} onChange={e => setTitle(e.target.value)} maxLength={100} />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Description</label>
                            <textarea style={{ ...inp, minHeight: 110, resize: 'vertical' as const }} placeholder="Describe what you're looking for in creators, the content style, and your goals…" value={description} onChange={e => setDescription(e.target.value)} maxLength={1000} />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 10, textTransform: 'uppercase' }}>Campaign Type</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {(['paid', 'barter', 'hybrid'] as const).map(t => (
                                    <button key={t} onClick={() => setCampaignType(t)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `${campaignType === t ? 2 : 1}px solid ${campaignType === t ? P : BORDER}`, background: campaignType === t ? `${P}20` : 'transparent', color: campaignType === t ? P : '#777', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, textTransform: 'capitalize' }}>{t}</button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Targeting & Budget</h2>
                        <div>
                            <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 10, textTransform: 'uppercase' }}>Platforms</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                                {PLATFORMS.map(p => <button key={p} onClick={() => toggle(platforms, p, setPlatforms)} style={{ padding: '7px 14px', borderRadius: 10, border: `${platforms.includes(p) ? 2 : 1}px solid ${platforms.includes(p) ? P : BORDER}`, background: platforms.includes(p) ? `${P}20` : 'transparent', color: platforms.includes(p) ? P : '#777', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>{p}</button>)}
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 10, textTransform: 'uppercase' }}>Target Niches</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                                {NICHES.map(n => <button key={n} onClick={() => toggle(niches, n, setNiches)} style={{ padding: '7px 14px', borderRadius: 10, border: `${niches.includes(n) ? 2 : 1}px solid ${niches.includes(n) ? P : BORDER}`, background: niches.includes(n) ? `${P}20` : 'transparent', color: niches.includes(n) ? P : '#777', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>{n}</button>)}
                            </div>
                        </div>
                        {(campaignType === 'paid' || campaignType === 'hybrid') && (
                            <div style={{ display: 'flex', gap: 10 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Budget Min (₹)</label>
                                    <input style={inp} type="number" placeholder="5000" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Budget Max (₹)</label>
                                    <input style={inp} type="number" placeholder="50000" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} />
                                </div>
                            </div>
                        )}
                        {(campaignType === 'barter' || campaignType === 'hybrid') && (
                            <div>
                                <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Barter Details</label>
                                <input style={inp} placeholder="Free product worth ₹2500 + 10% commission" value={barterDetails} onChange={e => setBarterDetails(e.target.value)} />
                            </div>
                        )}
                    </>
                )}

                {step === 3 && (
                    <>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Deliverables & Requirements</h2>
                        {deliverables.map((d, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8 }}>
                                <input style={{ ...inp, flex: 1 }} placeholder={`Deliverable ${i + 1}…`} value={d} onChange={e => { const n = [...deliverables]; n[i] = e.target.value; setDeliverables(n); }} />
                                {deliverables.length > 1 && <button onClick={() => setDeliverables(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><Icon n="delete" style={{ fontSize: 20 }} /></button>}
                            </div>
                        ))}
                        {deliverables.length < 8 && (
                            <button onClick={() => setDeliverables(p => [...p, ''])} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: `${P}10`, border: `1px dashed ${P}50`, borderRadius: 10, color: P, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                                <Icon n="add" style={{ fontSize: 18 }} /> Add Deliverable
                            </button>
                        )}
                        <div style={{ display: 'flex', gap: 10 }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Min Followers</label>
                                <input style={inp} type="number" placeholder="10000" value={minFollowers} onChange={e => setMinFollowers(e.target.value)} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Min Score</label>
                                <input style={inp} type="number" placeholder="400" value={minScore} onChange={e => setMinScore(e.target.value)} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Max Creators</label>
                                <input style={inp} type="number" placeholder="5" value={maxCreators} onChange={e => setMaxCreators(e.target.value)} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Deadline</label>
                                <input style={inp} type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
                            </div>
                        </div>
                    </>
                )}

                {error && <p style={{ color: '#f87171', fontSize: 13, background: '#f8717115', padding: '10px 14px', borderRadius: 8 }}>{error}</p>}
            </main>

            <div style={{ padding: '12px 16px 32px' }}>
                {step < 3 ? (
                    <button onClick={() => setStep(s => s + 1 as 2 | 3)} disabled={step === 1 && !title.trim()} style={{ width: '100%', padding: '15px 0', background: P, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', opacity: step === 1 && !title.trim() ? 0.5 : 1 }}>
                        Continue →
                    </button>
                ) : (
                    <button onClick={submit} disabled={loading} style={{ width: '100%', padding: '15px 0', background: P, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }}>
                        {loading ? 'Publishing…' : '📣 Launch Campaign'}
                    </button>
                )}
            </div>
        </div>
    );
}
