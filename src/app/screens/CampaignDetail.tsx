'use client';
import { useEffect, useState } from 'react';
import { Scr } from './types';
import { Icon, P_COLOR as P, BG, CARD, BORDER } from './ui';
import { useAuthStore } from '@/lib/store';

interface Campaign {
    id: string; title: string; description: string; campaign_type: string;
    budget_min: number | null; budget_max: number | null; barter_details: string | null;
    platforms: string[]; target_niches: string[]; deliverables: string[];
    min_followers: number | null; min_social_score: number | null;
    max_creators: number; deadline: string | null;
    brand_profiles: { company_name: string; logo_url: string | null; industry: string }
}

export default function CampaignDetailScreen({ campaignId, go }: { campaignId: string; go: (s: Scr, id?: string) => void }) {
    const { user, creatorProfile } = useAuthStore();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [pitch, setPitch] = useState('');
    const [proposedRate, setProposedRate] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [applied, setApplied] = useState(false);
    const [alreadyApplied, setAlreadyApplied] = useState(false);
    useEffect(() => {
        let mounted = true;
        fetch(`/api/campaigns/${campaignId}`)
            .then(res => res.json())
            .then(data => {
                if (!mounted) return;
                setCampaign(data.campaign ?? null);
                setAlreadyApplied(data.applied ?? false);
                setLoading(false);
            })
            .catch(() => { if (mounted) setLoading(false); });
        
        return () => { mounted = false; };
    }, [campaignId]);

    async function applyNow() {
        if (!creatorProfile?.id || !campaign) return;
        setSubmitting(true); setError('');

        try {
            const res = await fetch(`/api/campaigns/${campaignId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pitch: pitch.trim(),
                    proposed_rate: proposedRate ? parseFloat(proposedRate) : null,
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to apply');

            setApplied(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    if (applied) {
        return (
            <div style={{ minHeight: '100dvh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
                <div style={{ fontSize: 60 }}>📨</div>
                <h2 style={{ fontSize: 22, fontWeight: 800 }}>Application Sent!</h2>
                <p style={{ color: '#888', textAlign: 'center', fontSize: 14, lineHeight: 1.6 }}>
                    Your pitch has been sent to the brand.<br />You'll be notified when they respond.
                </p>
                <button onClick={() => go('campaigns')} style={{ padding: '13px 36px', background: P, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Back to Campaigns
                </button>
            </div>
        );
    }

    const inp = { width: '100%', background: `${P}0a`, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '13px 15px', color: '#eee', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const };

    if (loading || !campaign) {
        return (
            <div style={{ minHeight: '100dvh', background: BG }}>
                <div style={{ height: 140, background: `${P}10` }} />
                {[1, 2, 3].map(i => <div key={i} style={{ height: 20, background: `${P}08`, margin: '12px 20px', borderRadius: 8 }} />)}
            </div>
        );
    }

    const brand = campaign.brand_profiles;
    const isPaid = campaign.campaign_type !== 'barter';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: BG }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: `1px solid ${BORDER}30`, position: 'sticky', top: 0, background: BG, zIndex: 10 }}>
                <button onClick={() => go('campaigns')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' }}>
                    <Icon n="arrow_back" style={{ fontSize: 22 }} />
                </button>
                <span style={{ fontWeight: 700, fontSize: 16, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{campaign.title}</span>
                <span style={{ fontSize: 12, background: `${P}20`, color: P, padding: '4px 10px', borderRadius: 8, fontWeight: 700, textTransform: 'capitalize' }}>{campaign.campaign_type}</span>
            </header>

            <main style={{ flex: 1, overflowY: 'auto', padding: '0 0 180px' }}>
                {/* Brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 16px', borderBottom: `1px solid ${BORDER}20` }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: `${P}20`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {brand?.logo_url ? <img src={brand.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Icon n="storefront" style={{ color: P, fontSize: 28 }} />}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{brand?.company_name ?? 'Brand'}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{brand?.industry}</div>
                    </div>
                </div>

                {/* Budget */}
                {(campaign.budget_min || campaign.budget_max || campaign.barter_details) && (
                    <div style={{ margin: '16px', background: `${CARD}80`, borderRadius: 16, padding: 16, border: `1px solid #22c55e25` }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#22c55e', marginBottom: 6, textTransform: 'uppercase' }}>💰 Compensation</div>
                        {isPaid && (campaign.budget_min || campaign.budget_max) && (
                            <div style={{ fontWeight: 800, fontSize: 22 }}>
                                {campaign.budget_min && campaign.budget_max
                                    ? `₹${campaign.budget_min.toLocaleString('en-IN')} – ₹${campaign.budget_max.toLocaleString('en-IN')}`
                                    : `₹${(campaign.budget_max ?? campaign.budget_min)?.toLocaleString('en-IN')}`}
                            </div>
                        )}
                        {campaign.barter_details && <p style={{ color: '#aaa', fontSize: 13, marginTop: 4 }}>{campaign.barter_details}</p>}
                    </div>
                )}

                {/* Description */}
                <div style={{ padding: '0 16px 16px' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>About the Campaign</h3>
                    <p style={{ color: '#aaa', fontSize: 14, lineHeight: 1.6 }}>{campaign.description}</p>
                </div>

                {/* Details grid */}
                <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                    {[
                        { icon: 'group', label: 'Creators', val: `Up to ${campaign.max_creators}` },
                        { icon: 'people', label: 'Min Followers', val: campaign.min_followers ? `${(campaign.min_followers / 1000).toFixed(0)}k+` : 'Any' },
                        { icon: 'star', label: 'Min Score', val: campaign.min_social_score ?? 'Any' },
                        { icon: 'event', label: 'Deadline', val: campaign.deadline ? new Date(campaign.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Open' },
                    ].map(s => (
                        <div key={s.label} style={{ background: `${CARD}60`, borderRadius: 12, padding: 14 }}>
                            <Icon n={s.icon} style={{ fontSize: 18, color: P }} />
                            <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{String(s.val)}</div>
                            <div style={{ fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Platforms */}
                {campaign.platforms?.length > 0 && (
                    <div style={{ padding: '0 16px', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Platforms</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                            {campaign.platforms.map(p => <span key={p} style={{ background: `${P}15`, color: P, fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8, textTransform: 'capitalize' }}>{p}</span>)}
                        </div>
                    </div>
                )}

                {/* Deliverables */}
                {campaign.deliverables?.length > 0 && (
                    <div style={{ padding: '0 16px', marginBottom: 20 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Deliverables</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {campaign.deliverables.filter(d => d).map((d, i) => (
                                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                    <Icon n="check_circle" fill style={{ fontSize: 16, color: P, marginTop: 2, flexShrink: 0 }} />
                                    <span style={{ fontSize: 14, color: '#ccc', lineHeight: 1.4 }}>{d}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Application form */}
                {!alreadyApplied && (
                    <div style={{ padding: '0 16px' }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Your Application</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Pitch</label>
                                <textarea
                                    style={{ ...inp, minHeight: 110, resize: 'vertical' as const }}
                                    placeholder="Why are you a great fit for this campaign? Share your past work, niche, and audience…"
                                    value={pitch} onChange={e => setPitch(e.target.value)} maxLength={1000}
                                />
                                <span style={{ fontSize: 11, color: '#555' }}>{pitch.length}/1000</span>
                            </div>
                            {isPaid && (
                                <div>
                                    <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Proposed Rate (₹)</label>
                                    <input style={inp} type="number" placeholder="Leave blank to accept brand budget" value={proposedRate} onChange={e => setProposedRate(e.target.value)} />
                                </div>
                            )}
                            {error && <p style={{ color: '#f87171', fontSize: 13, background: '#f8717115', padding: '10px 14px', borderRadius: 8 }}>{error}</p>}
                        </div>
                    </div>
                )}
            </main>

            {/* Sticky apply button */}
            <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: '#120a18', borderTop: `1px solid ${BORDER}30`, padding: '14px 16px 28px' }}>
                {alreadyApplied ? (
                    <div style={{ textAlign: 'center', padding: '14px 0', color: '#22c55e', fontWeight: 700, fontSize: 15 }}>
                        <Icon n="check_circle" fill style={{ fontSize: 22, marginRight: 8, verticalAlign: 'middle' }} />
                        Already Applied
                    </div>
                ) : (
                    <button onClick={applyNow} disabled={submitting || !pitch.trim()} style={{ width: '100%', padding: '15px 0', background: P, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', opacity: (submitting || !pitch.trim()) ? 0.5 : 1 }}>
                        {submitting ? 'Submitting…' : '📨 Apply Now'}
                    </button>
                )}
            </div>
        </div>
    );
}
