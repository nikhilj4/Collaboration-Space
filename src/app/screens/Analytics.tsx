'use client';
import { useEffect, useState } from 'react';
import { Scr } from './types';
import { Icon, Nav, P_COLOR as P, BG, CARD, BORDER } from './ui';
import { useAuthStore } from '@/lib/store';

interface ScoreHistory { score: number; calculated_at: string }
interface SocialAccount {
    platform: string; followers_count: number; engagement_rate: number;
    avg_likes: number; avg_comments: number; reach_estimate: number;
}

const COLOR: Record<string, string> = {
    instagram: '#e1306c', youtube: '#ff0000', tiktok: '#69c9d0',
    twitter: '#1da1f2', facebook: '#1877f2', linkedin: '#0077b5',
};

function Bar({ pct, color }: { pct: number; color: string }) {
    return (
        <div style={{ height: 8, background: `${color}20`, borderRadius: 99, overflow: 'hidden', flex: 1 }}>
            <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 99, transition: 'width 0.8s ease' }} />
        </div>
    );
}

function ScoreArc({ score }: { score: number }) {
    const pct = Math.min(score / 10, 100);
    const r = 70, cx = 90, cy = 90;
    const circ = Math.PI * r; // half circle
    const offset = circ - (pct / 100) * circ;
    const color = score >= 800 ? '#22c55e' : score >= 600 ? '#f59e0b' : P;
    return (
        <svg width={180} height={100} viewBox="0 0 180 100">
            <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={`${color}20`} strokeWidth={14} strokeLinecap="round" />
            <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s ease' }} />
            <text x={cx} y={cy - 8} textAnchor="middle" fill="#fff" fontSize={28} fontWeight={800}>{score}</text>
            <text x={cx} y={cy + 12} textAnchor="middle" fill={color} fontSize={11} fontWeight={700}>SOCIAL SCORE</text>
        </svg>
    );
}

export default function AnalyticsScreen({ go }: { go: (s: Scr, id?: string) => void }) {
    const { user, creatorProfile } = useAuthStore();
    const [history, setHistory] = useState<ScoreHistory[]>([]);
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!creatorProfile?.id) { setLoading(false); return; }
        fetch('/api/analytics')
            .then(res => res.json())
            .then(data => {
                setHistory(data.history ?? []);
                setAccounts(data.accounts ?? []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [creatorProfile?.id]);

    const score = creatorProfile?.social_score ?? 0;
    const scoreLevel = score >= 800 ? { label: 'Elite', color: '#22c55e' } : score >= 600 ? { label: 'Rising Star', color: '#f59e0b' } : score >= 400 ? { label: 'Growing', color: P } : { label: 'New', color: '#888' };
    const totalFollowers = accounts.reduce((s, a) => s + a.followers_count, 0);
    const avgEngagement = accounts.length ? accounts.reduce((s, a) => s + a.engagement_rate, 0) / accounts.length : 0;
    const totalReach = accounts.reduce((s, a) => s + a.reach_estimate, 0);

    function fmt(n: number) { return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}k` : String(n); }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: BG }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: `1px solid ${BORDER}30` }}>
                <button onClick={() => go('profile')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' }}>
                    <Icon n="arrow_back" style={{ fontSize: 22 }} />
                </button>
                <span style={{ fontWeight: 700, fontSize: 18 }}>Analytics</span>
                <span style={{ marginLeft: 'auto', background: `${scoreLevel.color}20`, color: scoreLevel.color, fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8 }}>{scoreLevel.label}</span>
            </header>

            <main style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', paddingBottom: 88, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Score arc */}
                <div style={{ background: `${CARD}80`, borderRadius: 20, padding: '24px 16px 16px', border: `1px solid ${P}20`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <ScoreArc score={score} />
                    <div style={{ display: 'flex', gap: 12, marginTop: 16, width: '100%' }}>
                        {[
                            { label: 'Followers', value: fmt(totalFollowers), icon: 'group' },
                            { label: 'Avg Eng.', value: `${avgEngagement.toFixed(1)}%`, icon: 'trending_up' },
                            { label: 'Reach', value: fmt(totalReach), icon: 'visibility' },
                        ].map(s => (
                            <div key={s.label} style={{ flex: 1, background: `${P}08`, borderRadius: 12, padding: '12px 0', textAlign: 'center' }}>
                                <Icon n={s.icon} style={{ color: P, fontSize: 18, display: 'block', margin: '0 auto 4px' }} />
                                <div style={{ fontWeight: 800, fontSize: 16 }}>{s.value}</div>
                                <div style={{ fontSize: 10, color: '#555', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Score history sparkline */}
                {history.length > 1 && (
                    <div style={{ background: `${CARD}80`, borderRadius: 20, padding: 20, border: `1px solid ${P}15` }}>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Score History</div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
                            {history.map((h, i) => {
                                const max = Math.max(...history.map(x => x.score));
                                const ht = max > 0 ? (h.score / max) * 60 : 4;
                                return (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                        <div style={{ width: '100%', height: ht, background: `linear-gradient(to top, ${P}, ${P}60)`, borderRadius: '3px 3px 0 0', minHeight: 4 }} />
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                            <span style={{ fontSize: 10, color: '#555' }}>{new Date(history[0].calculated_at).toLocaleDateString('en-IN', { month: 'short' })}</span>
                            <span style={{ fontSize: 10, color: '#555' }}>{new Date(history[history.length - 1].calculated_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                        </div>
                    </div>
                )}

                {/* Platform breakdown */}
                {loading ? (
                    <div style={{ background: `${CARD}60`, borderRadius: 20, padding: 20, height: 180 }} />
                ) : accounts.length === 0 ? (
                    <div style={{ background: `${CARD}60`, borderRadius: 20, padding: 28, textAlign: 'center', border: `1px dashed ${P}30` }}>
                        <Icon n="link" style={{ fontSize: 40, color: '#444', display: 'block', margin: '0 auto 12px' }} />
                        <p style={{ color: '#666', fontSize: 14, fontWeight: 600 }}>No social accounts linked yet</p>
                        <p style={{ color: '#444', fontSize: 12, marginTop: 6 }}>Link your Instagram, YouTube, or TikTok to see analytics.</p>
                    </div>
                ) : (
                    <div style={{ background: `${CARD}80`, borderRadius: 20, padding: 20, border: `1px solid ${P}15`, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>Platform Breakdown</div>
                        {accounts.map(a => {
                            const color = COLOR[a.platform] ?? P;
                            const engPct = Math.min(a.engagement_rate * 5, 100);
                            return (
                                <div key={a.platform}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                                            <span style={{ fontWeight: 700, fontSize: 14, textTransform: 'capitalize' }}>{a.platform}</span>
                                        </div>
                                        <span style={{ fontSize: 13, color: '#aaa' }}>{fmt(a.followers_count)} followers</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ fontSize: 11, color: '#666', width: 60 }}>Engagement</span>
                                        <Bar pct={engPct} color={color} />
                                        <span style={{ fontSize: 12, fontWeight: 700, color, width: 38, textAlign: 'right' }}>{a.engagement_rate.toFixed(1)}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Per-account stats */}
                {accounts.map(a => {
                    const color = COLOR[a.platform] ?? P;
                    return (
                        <div key={a.platform + '-card'} style={{ background: `${CARD}80`, borderRadius: 20, padding: 20, border: `1px solid ${color}20` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <span style={{ fontWeight: 700, fontSize: 15, textTransform: 'capitalize' }}>{a.platform}</span>
                                <span style={{ fontSize: 12, color, fontWeight: 700 }}>#{a.platform}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {[
                                    { label: 'Followers', value: fmt(a.followers_count) },
                                    { label: 'Avg Likes', value: fmt(Math.round(a.avg_likes)) },
                                    { label: 'Avg Comments', value: fmt(Math.round(a.avg_comments)) },
                                    { label: 'Est. Reach', value: fmt(a.reach_estimate) },
                                ].map(s => (
                                    <div key={s.label} style={{ background: `${color}08`, borderRadius: 10, padding: '10px 12px' }}>
                                        <div style={{ fontWeight: 800, fontSize: 18, color }}>{s.value}</div>
                                        <div style={{ fontSize: 10, color: '#555', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </main>
            <Nav active="profile" go={go} />
        </div>
    );
}
