'use client';
import { useEffect, useRef, useState } from 'react';
import { Scr } from './types';
import { Icon, P_COLOR as P, BG, BORDER, CARD } from './ui';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';

interface Comment {
    id: string; user_id: string; content: string; likes_count: number; created_at: string;
    users: { full_name: string; username: string; avatar_url: string | null };
}
interface Post { id: string; caption: string; likes_count: number; media_urls: string[]; user_id: string; users: { full_name: string; username: string; avatar_url: string | null } }

export default function PostCommentsScreen({ postId, go }: { postId: string; go: (s: Scr) => void }) {
    const { user } = useAuthStore();
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    useEffect(() => {
        (async () => {
            const [{ data: p }, { data: c }] = await Promise.all([
                supabase.from('posts').select('id, caption, likes_count, media_urls, user_id, users ( full_name, username, avatar_url )').eq('id', postId).single(),
                supabase.from('post_comments').select('id, user_id, content, likes_count, created_at, users ( full_name, username, avatar_url )').eq('post_id', postId).order('created_at', { ascending: true }).limit(100),
            ]);
            setPost(p as unknown as Post);
            setComments((c as unknown as Comment[]) ?? []);
            setLoading(false);
        })();

        // Real-time new comments
        const ch = supabase.channel(`comments-${postId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'post_comments', filter: `post_id=eq.${postId}` },
                async payload => {
                    const { data: u } = await supabase.from('users').select('full_name, username, avatar_url').eq('id', payload.new.user_id).single();
                    setComments(prev => [...prev, { ...payload.new, users: u } as Comment]);
                })
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [postId, supabase]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [comments]);

    async function sendComment() {
        if (!draft.trim() || !user) return;
        setSending(true);
        const content = draft.trim();
        setDraft('');
        await supabase.from('post_comments').insert({ post_id: postId, user_id: user.id, content });
        // Increment comments_count on post
        await supabase.rpc('increment_post_comments' as any, { post_id: postId } as any).maybeSingle();
        setSending(false);
        inputRef.current?.focus();
    }

    function timeAgo(ts: string) {
        const d = (Date.now() - new Date(ts).getTime()) / 1000;
        if (d < 60) return 'just now';
        if (d < 3600) return `${Math.floor(d / 60)}m`;
        if (d < 86400) return `${Math.floor(d / 3600)}h`;
        return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }

    function Avatar({ url, name, size = 36 }: { url?: string | null; name: string; size?: number }) {
        return (
            <div style={{ width: size, height: size, borderRadius: '50%', background: `${P}25`, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, color: P, fontWeight: 700 }}>
                {url ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name[0]?.toUpperCase()}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: BG }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderBottom: `1px solid ${BORDER}30`, flexShrink: 0 }}>
                <button onClick={() => go('feed')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' }}>
                    <Icon n="arrow_back" style={{ fontSize: 22 }} />
                </button>
                <span style={{ fontWeight: 700, fontSize: 18 }}>Comments</span>
            </header>

            {/* Post preview */}
            {post && (
                <div style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${BORDER}20`, flexShrink: 0 }}>
                    {post.media_urls?.[0] && (
                        <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                            <img src={post.media_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    )}
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{post.users?.full_name}</div>
                        <p style={{ color: '#888', fontSize: 13, marginTop: 3, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{post.caption}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#666', flexShrink: 0 }}>
                        <Icon n="favorite" fill style={{ fontSize: 16, color: '#f43f5e' }} />
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{post.likes_count}</span>
                    </div>
                </div>
            )}

            {/* Comments */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 0' }}>
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 16px' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${P}15` }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ height: 12, width: '40%', background: `${P}15`, borderRadius: 6, marginBottom: 8 }} />
                                <div style={{ height: 32, background: `${P}08`, borderRadius: 8 }} />
                            </div>
                        </div>
                    ))
                ) : comments.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#555' }}>
                        <Icon n="chat_bubble_outline" style={{ fontSize: 48, display: 'block', margin: '0 auto 12px', color: '#333' }} />
                        <p style={{ fontSize: 14, fontWeight: 600 }}>No comments yet</p>
                        <p style={{ fontSize: 12, marginTop: 6 }}>Be the first to comment!</p>
                    </div>
                ) : (
                    comments.map(c => (
                        <div key={c.id} style={{ display: 'flex', gap: 10, padding: '10px 16px' }}>
                            <Avatar url={c.users?.avatar_url} name={c.users?.full_name ?? 'U'} />
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 4 }}>
                                    <span style={{ fontWeight: 700, fontSize: 13 }}>{c.users?.username ?? c.users?.full_name}</span>
                                    <span style={{ fontSize: 11, color: '#555' }}>{timeAgo(c.created_at)}</span>
                                </div>
                                <div style={{ background: `${CARD}60`, borderRadius: '4px 16px 16px 16px', padding: '10px 14px', fontSize: 14, color: '#ddd', lineHeight: 1.45 }}>
                                    {c.content}
                                </div>
                                <div style={{ display: 'flex', gap: 12, marginTop: 6, paddingLeft: 4 }}>
                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: 12, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Icon n="favorite_border" style={{ fontSize: 14 }} /> {c.likes_count || ''}
                                    </button>
                                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: 12, fontFamily: 'inherit' }}>Reply</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ display: 'flex', gap: 10, padding: '10px 14px 28px', borderTop: `1px solid ${BORDER}20`, flexShrink: 0, alignItems: 'center' }}>
                <Avatar url={user ? null : null} name={user?.full_name ?? 'U'} size={34} />
                <input
                    ref={inputRef}
                    value={draft} onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendComment(); } }}
                    placeholder="Add a comment…"
                    style={{ flex: 1, background: `${BORDER}20`, border: 'none', borderRadius: 22, padding: '10px 16px', color: '#eee', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
                />
                <button onClick={sendComment} disabled={!draft.trim() || sending} style={{ background: 'none', border: 'none', cursor: 'pointer', color: draft.trim() ? P : '#444', transition: 'color 0.2s' }}>
                    <Icon n="send" style={{ fontSize: 22 }} />
                </button>
            </div>
        </div>
    );
}
