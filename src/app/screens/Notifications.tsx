'use client';
import { useEffect, useState } from 'react';
import { Scr } from './types';
import { Icon, Nav, P_COLOR as P, BG, CARD, BORDER } from './ui';
import { useAuthStore } from '@/lib/store';

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string;
    data: { amount?: string; action?: string };
    read_at: string | null;
    created_at: string;
}

const TABS = ['All', 'Sponsorship', 'Social'];

function timeAgo(ts: string) {
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsScreen({ go }: { go: (s: Scr) => void }) {
    const [notifs, setNotifs] = useState<Notification[]>([]);
    const [tab, setTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();
    useEffect(() => {
        if (!user) return;
        setLoading(true);

        const tabParam = tab === 1 ? 'sponsorship' : tab === 2 ? 'social' : 'all';
        fetch(`/api/notifications?tab=${tabParam}`)
            .then(res => res.json())
            .then(data => {
                setNotifs(data.notifications ?? []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [user, tab]);

    async function markRead(id: string) {
        const now = new Date().toISOString();
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, read_at: now } : n));
        await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'read_one', id }),
        });
    }

    async function markAllRead() {
        if (!user) return;
        const now = new Date().toISOString();
        setNotifs(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? now })));
        await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'read_all' }),
        });
    }

    const unread = notifs.filter(n => !n.read_at).length;

    const typeIcon: Record<string, string> = {
        campaign_invite: 'campaign', payment: 'payments', follow: 'person_add',
        like: 'favorite', comment: 'chat_bubble', message: 'mail', gig_order: 'shopping_bag', system: 'info',
    };
    const typeColor: Record<string, string> = {
        campaign_invite: '#f59e0b', payment: '#22c55e', follow: P,
        like: '#ef4444', comment: P, message: P, gig_order: '#8b5cf6', system: '#888',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: BG }}>
            <header style={{ position: 'sticky', top: 0, background: `${BG}f0`, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${BORDER}40`, zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
                    <button onClick={() => go('feed')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' }}>
                        <Icon n="arrow_back" style={{ fontSize: 22 }} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 18 }}>Notifications</span>
                        {unread > 0 && <span style={{ background: P, color: '#fff', fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 12 }}>{unread}</span>}
                    </div>
                    {unread > 0
                        ? <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P, fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }}>All read</button>
                        : <div style={{ width: 60 }} />}
                </div>
                <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}40`, padding: '0 16px' }}>
                    {TABS.map((t, i) => (
                        <button key={t} onClick={() => setTab(i)} style={{ flex: 1, padding: '12px 0 10px', background: 'none', border: 'none', borderBottom: `2px solid ${tab === i ? P : 'transparent'}`, cursor: 'pointer', fontWeight: 700, fontSize: 14, color: tab === i ? P : '#555', fontFamily: 'inherit' }}>{t}</button>
                    ))}
                </div>
            </header>

            <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 88 }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} style={{ padding: '16px', display: 'flex', gap: 14, borderBottom: `1px solid ${BORDER}20` }}>
                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${P}20`, flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ width: '70%', height: 14, background: `${P}20`, borderRadius: 6, marginBottom: 8 }} />
                                    <div style={{ width: '50%', height: 12, background: `${P}10`, borderRadius: 6 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifs.length === 0 ? (
                    <div style={{ padding: 48, textAlign: 'center', color: '#555' }}>
                        <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
                        <p style={{ fontSize: 15, fontWeight: 600 }}>No notifications yet</p>
                        <p style={{ fontSize: 13, marginTop: 8 }}>We'll notify you about campaigns, messages, and more.</p>
                    </div>
                ) : notifs.map(n => {
                    const icon = typeIcon[n.type] ?? 'notifications';
                    const color = typeColor[n.type] ?? P;
                    const isUnread = !n.read_at;
                    return (
                        <div key={n.id} onClick={() => markRead(n.id)} style={{ display: 'flex', gap: 14, padding: '16px', borderBottom: `1px solid ${BORDER}20`, background: isUnread ? `${P}06` : 'transparent', cursor: 'pointer', transition: 'background 0.2s' }}>
                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${color}30` }}>
                                <Icon n={icon} style={{ fontSize: 22, color }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                    <span style={{ fontWeight: isUnread ? 700 : 600, fontSize: 14, color: isUnread ? '#fff' : '#ccc', lineHeight: 1.4 }}>{n.title}</span>
                                    <span style={{ fontSize: 11, color: '#555', whiteSpace: 'nowrap', flexShrink: 0 }}>{timeAgo(n.created_at)}</span>
                                </div>
                                {n.body && <p style={{ fontSize: 13, color: '#777', marginTop: 4, lineHeight: 1.4, marginBottom: 0 }}>{n.body}</p>}
                                {n.data?.amount && (
                                    <span style={{ display: 'inline-block', marginTop: 8, background: '#22c55e18', color: '#22c55e', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 6 }}>₹{n.data.amount}</span>
                                )}
                                {isUnread && <div style={{ width: 7, height: 7, borderRadius: '50%', background: P, marginTop: 8 }} />}
                            </div>
                        </div>
                    );
                })}
            </main>
            <Nav active="notifications" go={go} />
        </div>
    );
}
