'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Scr } from './types';
import { Icon, Nav, P_COLOR as P, BG, CARD, BORDER } from './ui';
import { createClient } from '@/lib/supabase/client';

interface Creator {
    id: string;
    social_score: number;
    categories: string[];
    users: { full_name: string; username: string; avatar_url: string };
    social_accounts: { platform: string; followers_count: number; engagement_rate: number }[];
}

const NICHES = ['All', 'Fashion', 'Beauty', 'Tech', 'Food', 'Travel', 'Fitness', 'Gaming'];

export default function DiscoverScreen({ go }: { go: (s: Scr) => void }) {
    const [creators, setCreators] = useState<Creator[]>([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [activeNiche, setActiveNiche] = useState('All');
    const supabase = createClient();
    const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const fetchCreators = useCallback(async (search: string, niche: string) => {
        setLoading(true);
        const sb = supabase;
        let query = sb.from('creator_profiles')
            .select('id, social_score, categories, users!inner(full_name, username, avatar_url), social_accounts(platform, followers_count, engagement_rate)')
            .order('social_score', { ascending: false })
            .limit(30);

        if (niche !== 'All') query = query.contains('categories', [niche]);

        const { data } = await query;
        let results = (data as unknown as Creator[]) ?? [];

        // Client-side name search
        if (search.trim()) {
            const s = search.toLowerCase();
            results = results.filter(c =>
                c.users?.full_name?.toLowerCase().includes(s) ||
                c.users?.username?.toLowerCase().includes(s)
            );
        }
        setCreators(results);
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        clearTimeout(debounce.current);
        debounce.current = setTimeout(() => fetchCreators(q, activeNiche), 300);
        return () => clearTimeout(debounce.current);
    }, [q, activeNiche, fetchCreators]);

    function formatFollowers(n: number) {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
        return String(n);
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: BG }}>
            <header style={{ position: 'sticky', top: 0, background: `${BG}f0`, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${P}18`, padding: '16px 16px 12px', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontWeight: 700, fontSize: 20 }}>Discover</span>
                    <button onClick={() => go('campaigns')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: `${P}20`, border: `1px solid ${P}40`, borderRadius: 10, color: P, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                        <Icon n="campaign" style={{ fontSize: 16 }} /> Campaigns
                    </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', background: `${P}10`, border: `1px solid ${P}25`, borderRadius: 12, padding: '0 14px', height: 46, marginBottom: 12 }}>
                    <Icon n="search" style={{ color: `${P}90`, fontSize: 20 }} />
                    <input value={q} onChange={e => setQ(e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', flex: 1, marginLeft: 8, fontSize: 14, fontFamily: 'inherit' }} placeholder="Search creators by name or niche…" />
                    {q && <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><Icon n="close" style={{ fontSize: 18 }} /></button>}
                </div>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                    {NICHES.map(n => (
                        <button key={n} onClick={() => setActiveNiche(n)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: activeNiche === n ? P : `${P}15`, color: activeNiche === n ? '#fff' : '#888', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}>{n}</button>
                    ))}
                </div>
            </header>

            <main style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 88, overflowY: 'auto' }}>
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} style={{ background: `${CARD}60`, borderRadius: 16, padding: 16, border: `1px solid ${BORDER}40` }}>
                            <div style={{ display: 'flex', gap: 14 }}>
                                <div style={{ width: 80, height: 80, borderRadius: 12, background: `${P}20` }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ width: '50%', height: 16, background: `${P}20`, borderRadius: 6, marginBottom: 8 }} />
                                    <div style={{ width: '35%', height: 12, background: `${P}10`, borderRadius: 6 }} />
                                </div>
                            </div>
                        </div>
                    ))
                ) : creators.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#555' }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
                        <p style={{ fontSize: 15, fontWeight: 600 }}>No creators found</p>
                        <p style={{ fontSize: 13, marginTop: 8 }}>Try a different search or niche filter</p>
                    </div>
                ) : creators.map(c => {
                    const bestAcct = (c.social_accounts as any[] | undefined)?.sort((a, b) => b.followers_count - a.followers_count)[0];
                    return (
                        <div key={c.id} style={{ background: `${CARD}80`, borderRadius: 16, padding: 16, border: `1px solid ${P}18` }}>
                            <div style={{ display: 'flex', gap: 14 }}>
                                <div style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', background: `${P}20`, flexShrink: 0 }}>
                                    {c.users?.avatar_url && <img src={c.users.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 16 }}>{c.users?.full_name ?? 'Creator'}</div>
                                            <div style={{ color: P, fontSize: 13, marginTop: 2 }}>@{c.users?.username ?? '...'}</div>
                                        </div>
                                        <div style={{ background: `${P}25`, borderRadius: 8, padding: '4px 10px', textAlign: 'center', minWidth: 52 }}>
                                            <div style={{ fontSize: 9, color: P, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Score</div>
                                            <div style={{ color: P, fontWeight: 800, fontSize: 20, lineHeight: 1.1 }}>{c.social_score}</div>
                                        </div>
                                    </div>
                                    {c.categories?.length > 0 && (
                                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                                            {c.categories.slice(0, 3).map(cat => (
                                                <span key={cat} style={{ fontSize: 11, background: `${P}15`, color: P, padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>{cat}</span>
                                            ))}
                                        </div>
                                    )}
                                    {bestAcct && (
                                        <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
                                            <div>
                                                <div style={{ fontSize: 10, color: '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Followers</div>
                                                <div style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>{formatFollowers(bestAcct.followers_count)}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 10, color: '#666', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Engagement</div>
                                                <div style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>{bestAcct.engagement_rate?.toFixed(1)}%</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button onClick={() => go('analytics')} style={{ marginTop: 14, width: '100%', padding: '12px 0', background: P, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 4px 16px ${P}35` }}>View Social Card</button>
                        </div>
                    );
                })}
            </main>
            <Nav active="discover" go={go} />
        </div>
    );
}
