'use client';
import { useState } from 'react';
import { Scr } from './types';
import { Icon, P_COLOR as P, BG, BORDER } from './ui';

const inp = {
    width: '100%', background: `${P}0a`, border: `1px solid ${BORDER}`,
    borderRadius: 12, padding: '13px 15px', color: '#eee', fontSize: 14,
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const,
};

const PLATFORMS = ['Instagram', 'YouTube', 'TikTok', 'Twitter / X', 'Facebook'];

export default function GigBuilder({ go }: { go: (s: Scr) => void }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [platforms, setPlatforms] = useState<string[]>([]);
    const [deliverables, setDeliverables] = useState(['']);
    const [packages, setPackages] = useState({
        basic: { price: '', delivery_days: '3', revisions: '1', description: '' },
        standard: { price: '', delivery_days: '7', revisions: '2', description: '' },
        premium: { price: '', delivery_days: '14', revisions: '3', description: '' },
    });

    function togglePlatform(p: string) {
        setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
    }

    function updateDeliverable(i: number, val: string) {
        const next = [...deliverables];
        next[i] = val;
        setDeliverables(next);
    }

    async function submit() {
        setLoading(true); setError('');
        const body = {
            title, description, category, platforms,
            deliverables: deliverables.filter(d => d.trim()),
            packages: {
                basic: { ...packages.basic, price: parseInt(packages.basic.price, 10), delivery_days: parseInt(packages.basic.delivery_days, 10), revisions: parseInt(packages.basic.revisions, 10) },
                standard: packages.standard.price ? { ...packages.standard, price: parseInt(packages.standard.price, 10), delivery_days: parseInt(packages.standard.delivery_days, 10), revisions: parseInt(packages.standard.revisions, 10) } : undefined,
                premium: packages.premium.price ? { ...packages.premium, price: parseInt(packages.premium.price, 10), delivery_days: parseInt(packages.premium.delivery_days, 10), revisions: parseInt(packages.premium.revisions, 10) } : undefined,
            },
        };
        const res = await fetch('/api/gigs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) { setError(data.error); setLoading(false); return; }
        setSuccess(true);
        setTimeout(() => go('profile'), 1500);
    }

    if (success) {
        return (
            <div style={{ minHeight: '100dvh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <div style={{ fontSize: 56 }}>🎉</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Gig Published!</h2>
                <p style={{ color: '#888', fontSize: 14 }}>Brands can now find and book your gig.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: BG, fontFamily: "'Spline Sans', sans-serif" }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: `1px solid ${BORDER}40` }}>
                <button onClick={() => step > 1 ? setStep(s => s - 1 as 1 | 2 | 3) : go('create-menu')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' }}>
                    <Icon n="arrow_back" style={{ fontSize: 22 }} />
                </button>
                <span style={{ fontWeight: 700, fontSize: 18 }}>Create a Gig</span>
                <span style={{ marginLeft: 'auto', fontSize: 13, color: '#666' }}>{step}/3</span>
            </header>

            {/* Progress */}
            <div style={{ display: 'flex', gap: 4, padding: '12px 16px 0' }}>
                {[1, 2, 3].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i <= step ? P : BORDER, transition: 'background 0.3s' }} />)}
            </div>

            <main style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {step === 1 && (
                    <>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Gig Details</h2>
                        <div>
                            <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Gig Title</label>
                            <input style={inp} placeholder="I will create an Instagram Reel for your brand…" value={title} onChange={e => setTitle(e.target.value)} maxLength={80} />
                            <span style={{ fontSize: 11, color: '#555' }}>{title.length}/80</span>
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Description</label>
                            <textarea style={{ ...inp, minHeight: 110, resize: 'vertical' as const }} placeholder="Describe what you'll deliver, your style, and why brands should choose you…" value={description} onChange={e => setDescription(e.target.value)} maxLength={1000} />
                            <span style={{ fontSize: 11, color: '#555' }}>{description.length}/1000</span>
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Category</label>
                            <select style={inp} value={category} onChange={e => setCategory(e.target.value)}>
                                <option value="">Select…</option>
                                {['Photo / Image Post', 'Short Video / Reel', 'YouTube Video', 'Story / Highlight', 'Live Stream', 'Blog / Review'].map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 10, textTransform: 'uppercase' }}>Platforms</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                                {PLATFORMS.map(p => {
                                    const sel = platforms.includes(p);
                                    return (
                                        <button key={p} onClick={() => togglePlatform(p)} style={{ padding: '8px 14px', borderRadius: 10, border: `${sel ? 2 : 1}px solid ${sel ? P : BORDER}`, background: sel ? `${P}20` : 'transparent', color: sel ? P : '#777', fontWeight: sel ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>{p}</button>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Deliverables</h2>
                        <p style={{ color: '#888', fontSize: 13 }}>What exactly will you provide?</p>
                        {deliverables.map((d, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8 }}>
                                <input style={{ ...inp, flex: 1 }} placeholder={`Deliverable ${i + 1}…`} value={d} onChange={e => updateDeliverable(i, e.target.value)} />
                                {deliverables.length > 1 && (
                                    <button onClick={() => setDeliverables(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                                        <Icon n="delete" style={{ fontSize: 20 }} />
                                    </button>
                                )}
                            </div>
                        ))}
                        {deliverables.length < 8 && (
                            <button onClick={() => setDeliverables(prev => [...prev, ''])} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: `${P}10`, border: `1px dashed ${P}50`, borderRadius: 10, color: P, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                                <Icon n="add" style={{ fontSize: 18 }} /> Add Deliverable
                            </button>
                        )}
                    </>
                )}

                {step === 3 && (
                    <>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Packages & Pricing</h2>
                        <p style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>Set prices for each tier. Standard and Premium are optional.</p>
                        {(['basic', 'standard', 'premium'] as const).map((tier, ti) => (
                            <div key={tier} style={{ background: `${P}08`, borderRadius: 16, padding: 16, border: `1px solid ${P}${ti === 0 ? '40' : '18'}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <span style={{ fontSize: 16 }}>{ti === 0 ? '🌱' : ti === 1 ? '⚡' : '🏆'}</span>
                                    <span style={{ fontWeight: 700, fontSize: 15, textTransform: 'capitalize' }}>{tier}</span>
                                    {tier !== 'basic' && <span style={{ fontSize: 11, color: '#555' }}>(optional)</span>}
                                </div>
                                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 4 }}>Price (₹)</label>
                                        <input style={inp} type="number" placeholder="999" value={packages[tier].price} onChange={e => setPackages(p => ({ ...p, [tier]: { ...p[tier], price: e.target.value } }))} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 4 }}>Days</label>
                                        <input style={inp} type="number" placeholder="7" value={packages[tier].delivery_days} onChange={e => setPackages(p => ({ ...p, [tier]: { ...p[tier], delivery_days: e.target.value } }))} />
                                    </div>
                                </div>
                                <input style={inp} placeholder="What's included…" value={packages[tier].description} onChange={e => setPackages(p => ({ ...p, [tier]: { ...p[tier], description: e.target.value } }))} />
                            </div>
                        ))}
                    </>
                )}

                {error && <p style={{ color: '#f87171', fontSize: 13, background: '#f8717115', padding: '10px 14px', borderRadius: 8 }}>{error}</p>}
            </main>

            <div style={{ padding: '12px 16px 32px' }}>
                {step < 3 ? (
                    <button onClick={() => setStep(s => s + 1 as 2 | 3)} disabled={step === 1 && (!title.trim() || !platforms.length)} style={{ width: '100%', padding: '15px 0', background: P, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 6px 24px ${P}40`, opacity: step === 1 && (!title.trim() || !platforms.length) ? 0.5 : 1 }}>
                        Continue →
                    </button>
                ) : (
                    <button onClick={submit} disabled={loading || !packages.basic.price} style={{ width: '100%', padding: '15px 0', background: P, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 6px 24px ${P}40`, opacity: loading || !packages.basic.price ? 0.6 : 1 }}>
                        {loading ? 'Publishing…' : '🚀 Publish Gig'}
                    </button>
                )}
            </div>
        </div>
    );
}
