'use client';
import { useEffect, useState } from 'react';
import { Scr } from './types';
import { Icon, Nav, P_COLOR as P, BG, CARD, BORDER } from './ui';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';

interface Post { id: string; media_urls: string[]; likes_count: number; caption: string }

export default function ProfileScreen({ go }: { go: (s: Scr) => void }) {
    const { user, creatorProfile, signOut } = useAuthStore();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!user) return;
        supabase.from('posts').select('id, media_urls, likes_count, caption')
            .eq('user_id', user.id).order('created_at', { ascending: false }).limit(12)
            .then(({ data }) => { setPosts((data as Post[]) ?? []); setLoading(false); });
    }, [user, supabase]);

    async function handleSignOut() { await signOut(); window.location.href = '/auth/login'; }

    const score = creatorProfile?.social_score ?? 0;
    const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : P;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: BG }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${BORDER}30` }}>
                <span style={{ fontWeight: 700, fontSize: 18 }}>@{user?.username ?? user?.full_name}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => go('wallet')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' }}>
                        <Icon n="account_balance_wallet" style={{ fontSize: 22 }} />
                    </button>
                    <button onClick={handleSignOut} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                        <Icon n="logout" style={{ fontSize: 22 }} />
                    </button>
                </div>
            </header>

            <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 88 }}>
                {/* Profile card */}
                <div style={{ padding: '24px 20px 20px' }}>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', border: `2.5px solid ${P}60`, overflow: 'hidden', background: `${P}20`, flexShrink: 0 }}>
                            {user?.avatar_url && <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: 20 }}>{user?.full_name}</div>
                            {creatorProfile?.bio && <p style={{ color: '#888', fontSize: 13, marginTop: 4, lineHeight: 1.4 }}>{creatorProfile.bio}</p>}
                        </div>
                    </div>
                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                        {[
                            { label: 'Posts', value: posts.length },
                            { label: 'Social Score', value: score, color: scoreColor },
                        ].map(s => (
                            <div key={s.label} style={{ flex: 1, background: `${P}10`, borderRadius: 12, padding: '12px 0', textAlign: 'center', border: `1px solid ${P}20` }}>
                                <div style={{ fontWeight: 800, fontSize: 22, color: s.color ?? '#fff' }}>{s.value}</div>
                                <div style={{ fontSize: 11, color: '#555', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => go('analytics')} style={{ width: '100%', marginTop: 14, padding: '12px 0', background: `${P}18`, border: `1px solid ${P}40`, borderRadius: 12, color: P, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                        View Full Analytics
                    </button>
                </div>

                {/* Posts grid */}
                <div style={{ borderTop: `1px solid ${BORDER}30`, paddingTop: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: 12 }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>Posts</span>
                        <button onClick={() => go('create-menu')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', background: P, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                            <Icon n="add" style={{ fontSize: 16 }} /> Post
                        </button>
                    </div>
                    {loading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, padding: '0 2px' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} style={{ aspectRatio: '1', background: `${P}15` }} />)}
                        </div>
                    ) : posts.length === 0 ? (
                        <div style={{ padding: 32, textAlign: 'center', color: '#555' }}>
                            <Icon n="photo_library" style={{ fontSize: 48, color: '#333', display: 'block', margin: '0 auto 12px' }} />
                            <p style={{ fontSize: 14 }}>No posts yet</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                            {posts.map(p => (
                                <div key={p.id} style={{ aspectRatio: '1', background: CARD, overflow: 'hidden', position: 'relative' }}>
                                    {p.media_urls?.[0]
                                        ? <img src={p.media_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${P}15` }}><Icon n="text_fields" style={{ color: P, fontSize: 32 }} /></div>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Nav active="profile" go={go} />
        </div>
    );
}
