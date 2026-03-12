'use client';
import { useEffect, useState } from 'react';
import { Scr } from './types';
import { Icon, Nav, P_COLOR as P, BG, CARD, BORDER } from './ui';

interface Campaign {
    id: string;
    title: string;
    description: string;
    campaign_type: string;
    budget_min: number;
    budget_max: number;
    platforms: string[];
    target_niches: string[];
    deadline: string;
    brand_profiles: { brand_name: string; logo_url: string; verification_status: string };
}

interface Gig {
    id: string;
    title: string;
    category: string;
    rating: number;
    total_orders: number;
    gig_packages: { name: string; price: number; delivery_days: number }[];
    creator_profiles: { social_score: number; users: { full_name: string; avatar_url: string } };
}

export default function CampaignsScreen({ go }: { go: (s: Scr, id?: string) => void }) {
    const [tab, setTab] = useState<'sponsorships' | 'gigs'>('sponsorships');
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [gigs, setGigs] = useState<Gig[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        setLoading(true);
        fetch(`/api/campaigns?tab=${tab}`)
            .then(res => res.json())
            .then(data => {
                if (tab === 'sponsorships') setCampaigns(data.campaigns ?? []);
                else setGigs(data.gigs ?? []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [tab]);

    const typeTag: Record<string, { label: string; color: string }> = {
        paid: { label: 'PAID', color: '#22c55e' },
        barter: { label: 'BARTER', color: '#f59e0b' },
        hybrid: { label: 'HYBRID', color: P },
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: BG }}>
            <header style={{ position: 'sticky', top: 0, background: `${BG}f0`, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${P}15`, padding: '14px 16px 10px', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontWeight: 800, fontSize: 20 }}>Campaigns</span>
                    <button onClick={() => go('notifications')} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Icon n="notifications" style={{ color: '#ccc', fontSize: 22 }} />
                    </button>
                </div>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4 }}>
                    {(['sponsorships', 'gigs'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '9px 0', background: tab === t ? P : 'none', borderRadius: 8, border: 'none', color: tab === t ? '#fff' : '#666', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>{t}</button>
                    ))}
                </div>
            </header>

            <main style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 88px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} style={{ background: `${CARD}60`, borderRadius: 16, padding: 16 }}>
                            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${P}20` }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ width: '55%', height: 14, background: `${P}20`, borderRadius: 6, marginBottom: 8 }} />
                                    <div style={{ width: '35%', height: 12, background: `${P}10`, borderRadius: 6 }} />
                                </div>
                            </div>
                            <div style={{ width: '85%', height: 12, background: `${P}10`, borderRadius: 6, marginBottom: 6 }} />
                            <div style={{ width: '60%', height: 12, background: `${P}08`, borderRadius: 6 }} />
                        </div>
                    ))
                ) : tab === 'sponsorships' ? (
                    campaigns.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', color: '#555' }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                            <p style={{ fontSize: 15, fontWeight: 600 }}>No active campaigns</p>
                            <p style={{ fontSize: 13, marginTop: 8 }}>Check back soon!</p>
                        </div>
                    ) : campaigns.map(c => {
                        const tag = typeTag[c.campaign_type] ?? typeTag.paid;
                        return (
                            <div key={c.id} style={{ background: `${CARD}80`, borderRadius: 16, padding: 16, border: `1px solid ${P}12` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${P}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                            {c.brand_profiles?.logo_url
                                                ? <img src={c.brand_profiles.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                : <Icon n="campaign" style={{ color: P, fontSize: 24 }} />}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 15 }}>{c.brand_profiles?.brand_name ?? 'Brand'}</div>
                                            <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                                                {c.target_niches?.slice(0, 2).map(n => (
                                                    <span key={n} style={{ fontSize: 11, background: `${P}15`, color: P, padding: '1px 7px', borderRadius: 5, fontWeight: 600 }}>{n}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <span style={{ background: `${tag.color}18`, color: tag.color, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{tag.label}</span>
                                </div>
                                <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{c.title}</p>
                                <p style={{ fontSize: 13, color: '#777', marginBottom: 14, lineHeight: 1.5 }}>{c.description?.slice(0, 100)}{c.description?.length > 100 ? '…' : ''}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${P}12`, paddingTop: 12 }}>
                                    <span style={{ fontSize: 12, color: '#555' }}>Due {c.deadline ? new Date(c.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Ongoing'}</span>
                                    {c.budget_min && <span style={{ fontWeight: 700, fontSize: 14, color: '#22c55e' }}>₹{c.budget_min.toLocaleString('en-IN')} – ₹{c.budget_max?.toLocaleString('en-IN')}</span>}
                                </div>
                                <button onClick={() => (go as (s: Scr, id?: string) => void)('campaign-detail', c.id)} style={{ width: '100%', marginTop: 12, padding: '11px 0', background: P, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Apply Now</button>
                            </div>
                        );
                    })
                ) : (
                    gigs.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', color: '#555' }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
                            <p style={{ fontSize: 15, fontWeight: 600 }}>No gigs listed yet</p>
                            <button onClick={() => go('gig-builder')} style={{ marginTop: 14, padding: '12px 24px', background: P, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Create your first Gig</button>
                        </div>
                    ) : gigs.map(g => {
                        const basePackage = g.gig_packages?.find(p => p.name === 'basic') ?? g.gig_packages?.[0];
                        return (
                            <div key={g.id} onClick={() => (go as (s: Scr, id?: string) => void)('gig-detail', g.id)} style={{ background: `${CARD}80`, borderRadius: 16, padding: 16, border: `1px solid ${P}12`, cursor: 'pointer' }}>
                                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 12, background: `${P}20`, overflow: 'hidden' }}>
                                        {g.creator_profiles?.users?.avatar_url && <img src={g.creator_profiles.users.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>{g.creator_profiles?.users?.full_name ?? 'Creator'}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                                            <span style={{ fontSize: 11, color: '#f59e0b' }}>★ {g.rating?.toFixed(1) ?? '—'}</span>
                                            <span style={{ fontSize: 11, color: '#555' }}>({g.total_orders} orders)</span>
                                        </div>
                                    </div>
                                </div>
                                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{g.title}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 12, color: '#555' }}>From</span>
                                    <span style={{ fontWeight: 800, fontSize: 18, color: P }}>₹{basePackage?.price?.toLocaleString('en-IN') ?? '—'}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </main>
            <Nav active="campaigns" go={go} />
        </div>
    );
}
