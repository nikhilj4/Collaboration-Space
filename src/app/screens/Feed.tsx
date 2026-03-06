'use client';
import { useEffect, useState, useCallback } from 'react';
import { Scr } from './types';
import { Icon, Nav, P_COLOR as P, BG, CARD, BORDER } from './ui';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';

interface Post {
    id: string;
    caption: string;
    media_urls: string[];
    likes_count: number;
    comments_count: number;
    user_id: string;
    users: { full_name: string; username: string; avatar_url: string };
    post_likes?: { user_id: string }[];
}

export default function FeedScreen({ go }: { go: (s: Scr) => void }) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(0);
    const { user } = useAuthStore();
    const supabase = createClient();

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        let query = supabase
            .from('posts')
            .select('*, users(full_name, username, avatar_url), post_likes(user_id)')
            .order('created_at', { ascending: false })
            .limit(20);

        if (tab === 1 && user) {
            // Following tab — posts from users this person follows
            const { data: follows } = await supabase
                .from('follows').select('following_id').eq('follower_id', user.id);
            const ids = follows?.map(f => f.following_id) ?? [];
            if (ids.length) query = query.in('user_id', ids);
        }

        const { data } = await query;
        setPosts((data as Post[]) ?? []);
        setLoading(false);
    }, [tab, user, supabase]);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    async function toggleLike(post: Post) {
        if (!user) return;
        const liked = post.post_likes?.some(l => l.user_id === user.id);
        if (liked) {
            await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
        } else {
            await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
        }
        fetchPosts();
    }

    const tabs = ['For You', 'Following', 'Creators'];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: BG }}>
            <header style={{ position: 'sticky', top: 0, zIndex: 40, background: `${BG}cc`, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${BORDER}40` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Icon n="hub" style={{ color: P, fontSize: 28 }} />
                        <span style={{ fontWeight: 700, fontSize: 18 }}>Nova Logic Studio</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => go('notifications')} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
                            <Icon n="notifications" style={{ color: '#ccc', fontSize: 22 }} />
                            <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: P }} />
                        </button>
                        <button onClick={() => go('messaging')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
                            <Icon n="send" style={{ color: '#ccc', fontSize: 22 }} />
                        </button>
                    </div>
                </div>
                <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}40` }}>
                    {tabs.map((t, i) => (
                        <button key={t} onClick={() => setTab(i)} style={{ flex: 1, textAlign: 'center', padding: '12px 0 10px', fontSize: 14, fontWeight: 700, color: tab === i ? P : '#666', borderBottom: `2px solid ${tab === i ? P : 'transparent'}`, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>{t}</button>
                    ))}
                </div>
            </header>

            <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 88 }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
                        {[1, 2].map(i => (
                            <div key={i} style={{ background: `${CARD}60`, borderRadius: 16, padding: 16 }}>
                                <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${P}20`, animation: 'pulse 1.5s ease-in-out infinite' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ width: '40%', height: 14, background: `${P}20`, borderRadius: 6, marginBottom: 6 }} />
                                        <div style={{ width: '60%', height: 12, background: `${P}10`, borderRadius: 6 }} />
                                    </div>
                                </div>
                                <div style={{ aspectRatio: '1', background: `${P}15`, borderRadius: 12 }} />
                            </div>
                        ))}
                        <style>{`@keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
                    </div>
                ) : posts.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#555' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                        <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No posts yet</p>
                        <p style={{ fontSize: 14 }}>{tab === 1 ? 'Follow creators to see their posts here.' : 'Be the first to post!'}</p>
                    </div>
                ) : posts.map(p => {
                    const liked = p.post_likes?.some(l => l.user_id === user?.id);
                    return (
                        <article key={p.id} style={{ padding: 16, borderBottom: `1px solid ${BORDER}30` }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '50%', border: `1.5px solid ${P}60`, overflow: 'hidden', background: `${P}20` }}>
                                        {p.users?.avatar_url && <img src={p.users.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>{p.users?.full_name ?? 'Unknown'}</div>
                                        <div style={{ color: '#666', fontSize: 12, marginTop: 2 }}>@{p.users?.username ?? '...'}</div>
                                    </div>
                                </div>
                                <button style={{ padding: '6px 14px', borderRadius: 999, background: `${P}20`, color: P, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Follow</button>
                            </div>
                            {p.media_urls?.[0] && (
                                <div style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '1', background: CARD }}>
                                    <img src={p.media_urls[0]} alt="post" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            )}
                            {p.caption && <p style={{ fontSize: 14, color: '#ccc', marginTop: 12, lineHeight: 1.5 }}>{p.caption}</p>}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={() => toggleLike(p)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 999, background: `${CARD}80`, border: 'none', cursor: 'pointer', color: liked ? P : '#888' }}>
                                        <Icon n="favorite" fill={liked} style={{ fontSize: 16, color: liked ? P : '#888' }} />
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#ccc', fontFamily: 'inherit' }}>{p.likes_count}</span>
                                    </button>
                                    <button onClick={() => (go as (s: Scr, id?: string) => void)('post-comments', p.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 999, background: `${CARD}80`, border: 'none', cursor: 'pointer' }}>
                                        <Icon n="chat_bubble" style={{ fontSize: 16, color: '#888' }} />
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#ccc', fontFamily: 'inherit' }}>{p.comments_count}</span>
                                    </button>
                                    <button style={{ padding: '6px 10px', borderRadius: 999, background: `${CARD}80`, border: 'none', cursor: 'pointer' }}>
                                        <Icon n="share" style={{ fontSize: 16, color: '#888' }} />
                                    </button>
                                </div>
                                <button style={{ padding: '6px 10px', borderRadius: 999, background: `${CARD}80`, border: 'none', cursor: 'pointer' }}>
                                    <Icon n="bookmark" style={{ fontSize: 20, color: '#888' }} />
                                </button>
                            </div>
                        </article>
                    );
                })}
            </main>
            <Nav active="feed" go={go} />
        </div>
    );
}
