'use client';
import { useEffect, useRef, useState } from 'react';
import { Scr } from './types';
import { Icon, P_COLOR as P, BG, BORDER } from './ui';
import { useAuthStore } from '@/lib/store';

interface Conversation {
    id: string; participant_1: string; participant_2: string;
    last_message?: string; last_message_at?: string;
    other_user?: { full_name: string; avatar_url: string; username: string };
}
interface Message {
    id: string; conversation_id: string; sender_id: string;
    content: string; message_type: string; created_at: string; read_at?: string;
}

export default function MessagingScreen({ go }: { go: (s: Scr, id?: string) => void }) {
    const { user } = useAuthStore();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConv, setActiveConv] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [loadingConvs, setLoadingConvs] = useState(true);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Load conversations list
    useEffect(() => {
        if (!user) return;
        fetch('/api/conversations')
            .then(res => res.json())
            .then(data => {
                if (data.conversations) setConversations(data.conversations);
                setLoadingConvs(false);
            })
            .catch(() => setLoadingConvs(false));
    }, [user]);

    // Load + poll messages when a conversation is opened
    useEffect(() => {
        if (!activeConv) return;
        let mounted = true;
        
        async function loadMsgs() {
            try {
                const res = await fetch(`/api/conversations/${activeConv!.id}`);
                const data = await res.json();
                if (mounted && data.messages) setMessages(data.messages);
            } catch (err) {}
        }
        
        loadMsgs();
        
        // Simple polling for new messages (every 4s)
        const iv = setInterval(loadMsgs, 4000);
        return () => { mounted = false; clearInterval(iv); };
    }, [activeConv]);

    // Auto-scroll on new messages
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

    async function sendMessage() {
        if (!draft.trim() || !activeConv || !user) return;
        setSending(true);
        const content = draft.trim();
        setDraft('');

        const tempId = 'temp-' + Date.now();
        setMessages(prev => [...prev, {
            id: tempId, conversation_id: activeConv.id, sender_id: user.id,
            content, message_type: 'text', created_at: new Date().toISOString()
        }]);

        await fetch(`/api/conversations/${activeConv.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        
        setSending(false);
    }

    function timeLabel(ts?: string) {
        if (!ts) return '';
        const d = (Date.now() - new Date(ts).getTime()) / 1000;
        if (d < 60) return 'now';
        if (d < 3600) return `${Math.floor(d / 60)}m`;
        if (d < 86400) return `${Math.floor(d / 3600)}h`;
        return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }

    // ────── Message view ──────
    if (activeConv) {
        const other = activeConv.other_user;
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: BG }}>
                {/* Header */}
                <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: `1px solid ${BORDER}30`, flexShrink: 0 }}>
                    <button onClick={() => setActiveConv(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' }}>
                        <Icon n="arrow_back" style={{ fontSize: 22 }} />
                    </button>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${P}25`, overflow: 'hidden', flexShrink: 0 }}>
                        {other?.avatar_url && <img src={other.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{other?.full_name ?? 'User'}</div>
                        <div style={{ fontSize: 11, color: P, fontWeight: 600 }}>@{other?.username ?? ''}</div>
                    </div>
                </header>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {messages.map(m => {
                        const mine = m.sender_id === user?.id;
                        return (
                            <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                                <div style={{
                                    maxWidth: '78%', padding: '10px 14px', borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                    background: mine ? P : `${BORDER}25`, fontSize: 14, lineHeight: 1.45,
                                    color: mine ? '#fff' : '#e0e0e0', wordBreak: 'break-word',
                                }}>
                                    {m.content}
                                    <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4, textAlign: 'right' }}>{timeLabel(m.created_at)}</div>
                                </div>
                            </div>
                        );
                    })}
                    {messages.length === 0 && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#444' }}>
                            <Icon n="chat_bubble_outline" style={{ fontSize: 48 }} />
                            <span style={{ fontSize: 14 }}>Say hi to {other?.full_name ?? 'them'} 👋</span>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div style={{ display: 'flex', gap: 10, padding: '10px 14px 28px', borderTop: `1px solid ${BORDER}20`, flexShrink: 0 }}>
                    <input
                        value={draft} onChange={e => setDraft(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        placeholder="Message…"
                        style={{ flex: 1, background: `${BORDER}20`, border: 'none', borderRadius: 22, padding: '11px 16px', color: '#eee', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
                    />
                    <button onClick={sendMessage} disabled={!draft.trim() || sending} style={{ width: 44, height: 44, borderRadius: '50%', background: draft.trim() ? P : `${P}30`, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
                        <Icon n="send" style={{ color: '#fff', fontSize: 20 }} />
                    </button>
                </div>
            </div>
        );
    }

    // ────── Conversations list ──────
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: BG }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${BORDER}30` }}>
                <span style={{ fontWeight: 700, fontSize: 18 }}>Messages</span>
                <button onClick={() => go('discover')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P }}>
                    <Icon n="edit" style={{ fontSize: 22 }} />
                </button>
            </header>

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 88 }}>
                {loadingConvs ? (
                    [1, 2, 3].map(i => (
                        <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 16px', borderBottom: `1px solid ${BORDER}15` }}>
                            <div style={{ width: 50, height: 50, borderRadius: '50%', background: `${P}15` }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ height: 14, width: '50%', background: `${P}15`, borderRadius: 6, marginBottom: 8 }} />
                                <div style={{ height: 12, width: '70%', background: `${P}08`, borderRadius: 6 }} />
                            </div>
                        </div>
                    ))
                ) : conversations.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#555' }}>
                        <Icon n="forum" style={{ fontSize: 56, display: 'block', margin: '0 auto 16px', color: '#333' }} />
                        <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No messages yet</p>
                        <p style={{ fontSize: 13 }}>Discover creators to start a conversation.</p>
                        <button onClick={() => go('discover')} style={{ marginTop: 20, padding: '12px 28px', background: P, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                            Discover Creators
                        </button>
                    </div>
                ) : conversations.map(c => {
                    const other = c.other_user;
                    return (
                        <button key={c.id} onClick={() => setActiveConv(c)} style={{ display: 'flex', gap: 12, padding: '14px 16px', borderBottom: `1px solid ${BORDER}15`, background: 'none', border: 'none', cursor: 'pointer', width: '100%', alignItems: 'center', textAlign: 'left' }}>
                            <div style={{ width: 50, height: 50, borderRadius: '50%', background: `${P}25`, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                                {other?.avatar_url && <img src={other.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontWeight: 700, fontSize: 15, color: '#eee' }}>{other?.full_name ?? 'User'}</span>
                                    <span style={{ fontSize: 11, color: '#555' }}>{timeLabel(c.last_message_at)}</span>
                                </div>
                                <span style={{ fontSize: 13, color: '#666', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', display: 'block' }}>
                                    {c.last_message ?? 'Tap to chat…'}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
