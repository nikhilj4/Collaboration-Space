'use client';
import { useEffect, useState } from 'react';
import { Scr } from './types';
import { Icon, Nav, P_COLOR as P, BG, CARD, BORDER } from './ui';
import { useAuthStore } from '@/lib/store';

interface Transaction {
    id: string; type: string; amount: number; description: string;
    reference_type: string; created_at: string;
}
interface Wallet { balance: number; pending_balance: number; total_earned: number; total_withdrawn: number }

const TYPE_ICON: Record<string, { icon: string; color: string }> = {
    credit: { icon: 'arrow_downward', color: '#22c55e' },
    debit: { icon: 'arrow_upward', color: '#f87171' },
    escrow_hold: { icon: 'lock', color: '#f59e0b' },
    escrow_release: { icon: 'lock_open', color: '#22c55e' },
    refund: { icon: 'undo', color: '#60a5fa' },
    platform_fee: { icon: 'percent', color: '#888' },
};

export default function WalletScreen({ go }: { go: (s: Scr, id?: string) => void }) {
    const { user } = useAuthStore();
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [txns, setTxns] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!user) return;
        let mounted = true;
        fetch('/api/wallet')
            .then(res => res.json())
            .then(data => {
                if (!mounted) return;
                setWallet(data.wallet ?? null);
                setTxns(data.txns ?? []);
                setLoading(false);
            })
            .catch(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [user]);

    function fmt(n: number) { return `₹${n?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}`; }
    function timeAgo(ts: string) {
        const d = (Date.now() - new Date(ts).getTime()) / 1000;
        if (d < 3600) return `${Math.floor(d / 60)}m ago`;
        if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
        return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: BG }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: `1px solid ${BORDER}30` }}>
                <button onClick={() => go('profile')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' }}>
                    <Icon n="arrow_back" style={{ fontSize: 22 }} />
                </button>
                <span style={{ fontWeight: 700, fontSize: 18 }}>Wallet</span>
            </header>

            <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 88 }}>
                {/* Balance card */}
                <div style={{ margin: '20px 16px', background: `linear-gradient(135deg, ${P}90, #3b0a69)`, borderRadius: 24, padding: 24, boxShadow: `0 12px 40px ${P}30` }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Available Balance</div>
                    {loading
                        ? <div style={{ width: 160, height: 42, background: 'rgba(255,255,255,0.1)', borderRadius: 8 }} />
                        : <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>{fmt(wallet?.balance ?? 0)}</div>}
                    <div style={{ display: 'flex', gap: 14, marginTop: 20 }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>Pending</div>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>{fmt(wallet?.pending_balance ?? 0)}</div>
                        </div>
                        <div style={{ width: 1, background: 'rgba(255,255,255,0.15)' }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>Total Earned</div>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>{fmt(wallet?.total_earned ?? 0)}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                        <button onClick={() => go('notifications')} style={{ flex: 1, padding: '12px 0', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                            Add Money
                        </button>
                        <button onClick={() => go('withdrawal')} style={{ flex: 1, padding: '12px 0', background: '#fff', border: 'none', borderRadius: 12, color: '#1f1022', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                            Withdraw
                        </button>
                    </div>
                </div>

                {/* Lifetime stats */}
                <div style={{ display: 'flex', gap: 10, padding: '0 16px', marginBottom: 20 }}>
                    {[
                        { label: 'Total Earned', value: fmt(wallet?.total_earned ?? 0), icon: 'trending_up' },
                        { label: 'Withdrawn', value: fmt(wallet?.total_withdrawn ?? 0), icon: 'account_balance' },
                    ].map(s => (
                        <div key={s.label} style={{ flex: 1, background: `${CARD}80`, borderRadius: 16, padding: 16, border: `1px solid ${P}12` }}>
                            <Icon n={s.icon} style={{ color: P, fontSize: 22 }} />
                            <div style={{ fontWeight: 800, fontSize: 18, marginTop: 8 }}>{s.value}</div>
                            <div style={{ fontSize: 11, color: '#555', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Transactions */}
                <div style={{ padding: '0 16px', marginBottom: 12 }}>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>Transactions</span>
                </div>

                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 16px', borderBottom: `1px solid ${BORDER}20` }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${P}15` }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ width: '55%', height: 14, background: `${P}15`, borderRadius: 6, marginBottom: 8 }} />
                                <div style={{ width: '35%', height: 12, background: `${P}08`, borderRadius: 6 }} />
                            </div>
                        </div>
                    ))
                ) : txns.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#555' }}>
                        <Icon n="receipt_long" style={{ fontSize: 48, display: 'block', margin: '0 auto 12px', color: '#333' }} />
                        <p style={{ fontSize: 14, fontWeight: 600 }}>No transactions yet</p>
                        <p style={{ fontSize: 12, marginTop: 6 }}>Complete a gig or campaign to earn.</p>
                    </div>
                ) : txns.map(t => {
                    const meta = TYPE_ICON[t.type] ?? { icon: 'payments', color: '#888' };
                    const isCredit = ['credit', 'escrow_release', 'refund'].includes(t.type);
                    return (
                        <div key={t.id} style={{ display: 'flex', gap: 14, padding: '14px 16px', borderBottom: `1px solid ${BORDER}15`, alignItems: 'center' }}>
                            <div style={{ width: 42, height: 42, borderRadius: '50%', background: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icon n={meta.icon} style={{ fontSize: 20, color: meta.color }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: 14, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t.description || t.type.replace(/_/g, ' ')}</div>
                                <div style={{ fontSize: 12, color: '#555', marginTop: 3 }}>{timeAgo(t.created_at)}</div>
                            </div>
                            <span style={{ fontWeight: 800, fontSize: 16, color: isCredit ? '#22c55e' : '#f87171', flexShrink: 0 }}>
                                {isCredit ? '+' : '-'}{fmt(Math.abs(t.amount))}
                            </span>
                        </div>
                    );
                })}
            </main>
            <Nav active="profile" go={go} />
        </div>
    );
}
