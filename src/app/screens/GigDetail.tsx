'use client';
import { useEffect, useState } from 'react';
import { Scr } from './types';
import { Icon, Nav, P_COLOR as P, BG, CARD, BORDER } from './ui';
import { useAuthStore } from '@/lib/store';
import RazorpayCheckout from './RazorpayCheckout';

interface Package { name: string; description: string; price: number; delivery_days: number; revisions: number; includes: string[] }
interface Gig {
    id: string; title: string; description: string; category: string; tags: string[];
    packages: Package[]; media_urls: string[]; views_count: number; orders_count: number;
    rating_avg: number; rating_count: number;
    creator_profiles: { bio: string; social_score: number; users: { full_name: string; username: string; avatar_url: string } }
}

export default function GigDetailScreen({ gigId, go }: { gigId: string; go: (s: Scr, id?: string) => void }) {
    const { user } = useAuthStore();
    const [gig, setGig] = useState<Gig | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPkg, setSelectedPkg] = useState(0);
    const [ordering, setOrdering] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [paid, setPaid] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        let mounted = true;
        fetch(`/api/gigs/${gigId}`)
            .then(res => res.json())
            .then(d => {
                if (!mounted) return;
                setGig(d.gig ?? null);
                setLoading(false);
            })
            .catch(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [gigId]);

    async function placeOrder() {
        if (!user || !gig) return;
        setOrdering(true); setError('');
        const pkg = gig.packages[selectedPkg];

        try {
            const res = await fetch(`/api/gigs/${gigId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    package_name: pkg.name,
                    price: pkg.price,
                    delivery_days: pkg.delivery_days,
                    seller_id: (gig.creator_profiles as any).id
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create order');
            
            setOrderId(data.orderId);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setOrdering(false);
        }
    }

    if (paid) {
        return (
            <div style={{ minHeight: '100dvh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
                <div style={{ fontSize: 60 }}>🎉</div>
                <h2 style={{ fontSize: 22, fontWeight: 800 }}>Order Placed!</h2>
                <p style={{ color: '#888', textAlign: 'center', fontSize: 14, lineHeight: 1.6 }}>
                    Your order has been sent to the creator.<br />
                    They have {gig?.packages[selectedPkg]?.delivery_days} days to deliver.
                </p>
                <button onClick={() => go('campaigns')} style={{ padding: '13px 36px', background: P, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
                    View Orders
                </button>
            </div>
        );
    }

    if (loading || !gig) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: BG }}>
                <div style={{ height: 200, background: `${P}15`, marginBottom: 16 }} />
                {[1, 2, 3].map(i => <div key={i} style={{ height: 20, background: `${P}10`, margin: '8px 20px', borderRadius: 8 }} />)}
            </div>
        );
    }

    const creator = gig.creator_profiles;
    const pkg = gig.packages[selectedPkg];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: BG }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: `1px solid ${BORDER}30`, position: 'sticky', top: 0, background: BG, zIndex: 10 }}>
                <button onClick={() => go('campaigns')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' }}>
                    <Icon n="arrow_back" style={{ fontSize: 22 }} />
                </button>
                <span style={{ fontWeight: 700, fontSize: 16, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gig.title}</span>
            </header>

            <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 160 }}>
                {/* Media */}
                {gig.media_urls?.[0] && (
                    <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', background: `${P}15` }}>
                        <img src={gig.media_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                )}

                {/* Creator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 0' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${P}25`, overflow: 'hidden' }}>
                        {creator?.users?.avatar_url && <img src={creator.users.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{creator?.users?.full_name ?? 'Creator'}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>@{creator?.users?.username} · Score {creator?.social_score ?? 0}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <Icon n="star" fill style={{ fontSize: 16, color: '#fbbf24' }} />
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{gig.rating_avg?.toFixed(1) ?? '—'}</span>
                        <span style={{ fontSize: 12, color: '#555' }}>({gig.rating_count})</span>
                    </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${BORDER}20` }}>
                    {[{ icon: 'visibility', val: gig.views_count ?? 0 }, { icon: 'shopping_bag', val: gig.orders_count ?? 0 }].map(s => (
                        <div key={s.icon} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Icon n={s.icon} style={{ fontSize: 14, color: '#666' }} />
                            <span style={{ fontSize: 13, color: '#666' }}>{s.val.toLocaleString()}</span>
                        </div>
                    ))}
                    {gig.tags?.map(t => <span key={t} style={{ fontSize: 12, background: `${P}18`, color: P, padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>#{t}</span>)}
                </div>

                {/* Description */}
                <div style={{ padding: '16px 16px' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>About this Gig</h3>
                    <p style={{ color: '#aaa', fontSize: 14, lineHeight: 1.6 }}>{gig.description}</p>
                </div>

                {/* Package selector */}
                {gig.packages?.length > 0 && (
                    <div style={{ padding: '0 16px 16px' }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Packages</h3>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            {gig.packages.map((p, i) => (
                                <button key={i} onClick={() => setSelectedPkg(i)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `${selectedPkg === i ? 2 : 1}px solid ${selectedPkg === i ? P : BORDER}`, background: selectedPkg === i ? `${P}20` : 'transparent', color: selectedPkg === i ? P : '#777', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    {p.name}
                                </button>
                            ))}
                        </div>
                        <div style={{ background: `${CARD}80`, borderRadius: 16, padding: 18, border: `1px solid ${P}20` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                <span style={{ fontWeight: 700, fontSize: 18 }}>₹{pkg.price.toLocaleString('en-IN')}</span>
                                <span style={{ fontSize: 13, color: '#777' }}>{pkg.delivery_days}d delivery · {pkg.revisions} revision{pkg.revisions !== 1 ? 's' : ''}</span>
                            </div>
                            <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>{pkg.description}</p>
                            {pkg.includes?.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {pkg.includes.map(item => (
                                        <div key={item} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <Icon n="check_circle" fill style={{ fontSize: 16, color: '#22c55e' }} />
                                            <span style={{ fontSize: 13, color: '#ccc' }}>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Sticky checkout */}
            <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: '#120a18', borderTop: `1px solid ${BORDER}30`, padding: '14px 16px 28px' }}>
                {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 8 }}>{error}</p>}
                {!orderId ? (
                    <button onClick={placeOrder} disabled={ordering} style={{ width: '100%', padding: '15px 0', background: P, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', opacity: ordering ? 0.6 : 1 }}>
                        {ordering ? 'Creating order…' : `Order Now · ₹${pkg?.price?.toLocaleString('en-IN') ?? '—'}`}
                    </button>
                ) : (
                    <RazorpayCheckout
                        amount={pkg.price}
                        gigOrderId={orderId}
                        buyerId={user?.id}
                        description={`${gig.title} — ${pkg.name}`}
                        onSuccess={() => setPaid(true)}
                        onDismiss={() => setOrderId(null)}
                    />
                )}
            </div>
        </div>
    );
}
