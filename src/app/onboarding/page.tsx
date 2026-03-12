'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

const P = '#d125f4';
const BG = '#1f1022';
const CARD = '#2d1b31';
const BORDER = '#4a2d52';

const inp = {
    width: '100%', background: `${P}0a`, border: `1px solid ${BORDER}`,
    borderRadius: 12, padding: '13px 15px', color: '#eee', fontSize: 14,
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const,
};

const CREATOR_NICHES = ['Fashion', 'Beauty', 'Tech', 'Food', 'Travel', 'Fitness', 'Gaming', 'Music', 'Comedy', 'Lifestyle', 'Finance', 'Education'];

export default function OnboardingPage() {
    const { user, loadSession, isLoading } = useAuthStore();
    const role = user?.role ?? 'creator';
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Creator fields
    const [bio, setBio] = useState('');
    const [username, setUsername] = useState('');
    const [location, setLocation] = useState('');
    const [categories, setCategories] = useState<string[]>([]);
    const [igHandle, setIgHandle] = useState('');
    const [ytHandle, setYtHandle] = useState('');
    const [ttHandle, setTtHandle] = useState('');

    // Brand fields
    const [brandName, setBrandName] = useState('');
    const [industry, setIndustry] = useState('');
    const [website, setWebsite] = useState('');
    const [brandDesc, setBrandDesc] = useState('');

    const totalSteps = role === 'creator' ? 3 : 2;

    // If already completed onboarding, skip to dashboard
    useEffect(() => {
        if (!isLoading && user?.onboarding_completed) {
            router.replace('/');
        }
    }, [isLoading, user, router]);

    const toggleCategory = useCallback((c: string) => {
        setCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : prev.length < 5 ? [...prev, c] : prev);
    }, []);

    async function finish() {
        setLoading(true);
        setError('');
        try {
            if (!user?.id) throw new Error('Not authenticated. Please log in again.');

            // Call server API — uses Admin SDK so no Firestore permission issues
            const res = await fetch('/api/auth/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role,
                    username,
                    bio,
                    location,
                    categories,
                    igHandle,
                    ytHandle,
                    ttHandle,
                    brandName,
                    industry,
                    website,
                    brandDesc,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Failed to save profile.');

            // Reload store so onboarding_completed becomes true, then navigate
            await loadSession();
            router.push('/');
            router.refresh();
        } catch (e: unknown) {
            console.error('Onboarding error:', e);
            setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    if (isLoading) {
        return (
            <div style={{ minHeight: '100dvh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 40, height: 40, border: '3px solid #4a2d52', borderTop: `3px solid ${P}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100dvh', background: BG, fontFamily: "'Spline Sans', sans-serif", display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: P }}>✦</div>
                <span style={{ fontSize: 13, color: '#666' }}>Step {step} of {totalSteps}</span>
            </header>

            {/* Progress */}
            <div style={{ display: 'flex', gap: 6, padding: '16px 20px' }}>
                {Array.from({ length: totalSteps }).map((_, i) => (
                    <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i < step ? P : BORDER, transition: 'background 0.3s' }} />
                ))}
            </div>

            <main style={{ flex: 1, padding: '8px 20px 32px', overflowY: 'auto' }}>
                {role === 'creator' ? (
                    <>
                        {step === 1 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Your Identity</h2>
                                <p style={{ color: '#888', fontSize: 14, marginBottom: 8 }}>How brands will find and know you.</p>
                                <div>
                                    <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Username</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: P, fontWeight: 700 }}>@</span>
                                        <input style={{ ...inp, paddingLeft: 30 }} placeholder="yourhandle" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Bio</label>
                                    <textarea style={{ ...inp, minHeight: 90, resize: 'vertical' as const }} placeholder="Tell brands about yourself…" value={bio} onChange={e => setBio(e.target.value)} maxLength={300} />
                                    <span style={{ fontSize: 11, color: '#555' }}>{bio.length}/300</span>
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Location</label>
                                    <input style={inp} placeholder="Mumbai, India" value={location} onChange={e => setLocation(e.target.value)} />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div>
                                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Your Niche</h2>
                                <p style={{ color: '#888', fontSize: 14, marginBottom: 16 }}>Pick up to 5 categories you create content in.</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 10 }}>
                                    {CREATOR_NICHES.map(c => {
                                        const sel = categories.includes(c);
                                        return (
                                            <button key={c} onClick={() => toggleCategory(c)} style={{ padding: '9px 16px', borderRadius: 10, border: `${sel ? 2 : 1}px solid ${sel ? P : BORDER}`, background: sel ? `${P}20` : `${P}06`, color: sel ? P : '#888', fontWeight: sel ? 700 : 400, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                                                {c}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p style={{ color: '#555', fontSize: 12, marginTop: 14 }}>{categories.length}/5 selected</p>
                            </div>
                        )}

                        {step === 3 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Social Links</h2>
                                <p style={{ color: '#888', fontSize: 14, marginBottom: 8 }}>Add your handles so brands can see your reach.</p>
                                {[
                                    { label: 'Instagram', icon: '📸', value: igHandle, set: setIgHandle, ph: '@yourhandle' },
                                    { label: 'YouTube', icon: '▶️', value: ytHandle, set: setYtHandle, ph: '@yourchannel' },
                                    { label: 'TikTok', icon: '🎵', value: ttHandle, set: setTtHandle, ph: '@yourhandle' },
                                ].map(s => (
                                    <div key={s.label}>
                                        <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>{s.icon} {s.label}</label>
                                        <input style={inp} placeholder={s.ph} value={s.value} onChange={e => s.set(e.target.value)} />
                                    </div>
                                ))}

                                {/* Summary card before launch */}
                                <div style={{ background: `${P}08`, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, marginTop: 8 }}>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: P, marginBottom: 8 }}>✦ Profile Summary</p>
                                    <p style={{ fontSize: 13, color: '#aaa', margin: 0 }}>@{username || 'username'} · {location || 'Location not set'}</p>
                                    {categories.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                                            {categories.map(c => <span key={c} style={{ fontSize: 11, background: `${P}20`, color: P, padding: '3px 8px', borderRadius: 6 }}>{c}</span>)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    /* Brand onboarding */
                    <>
                        {step === 1 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Brand Details</h2>
                                <div>
                                    <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Brand Name</label>
                                    <input style={inp} placeholder="Lumina Creative Agency" value={brandName} onChange={e => setBrandName(e.target.value)} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Industry</label>
                                    <select style={inp} value={industry} onChange={e => setIndustry(e.target.value)}>
                                        <option value="">Select industry…</option>
                                        {['Marketing', 'Fashion', 'Beauty', 'Tech', 'Food & Beverage', 'Fitness', 'Finance', 'Education', 'Travel', 'Other'].map(i => <option key={i}>{i}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Website</label>
                                    <input style={inp} type="url" placeholder="https://yourbrand.com" value={website} onChange={e => setWebsite(e.target.value)} />
                                </div>
                            </div>
                        )}
                        {step === 2 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>About Your Brand</h2>
                                <div>
                                    <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Description</label>
                                    <textarea style={{ ...inp, minHeight: 120, resize: 'vertical' as const }} placeholder="Tell creators what your brand is about…" value={brandDesc} onChange={e => setBrandDesc(e.target.value)} maxLength={500} />
                                    <span style={{ fontSize: 11, color: '#555' }}>{brandDesc.length}/500</span>
                                </div>

                                {/* Summary before launch */}
                                <div style={{ background: `${P}08`, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16 }}>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: P, marginBottom: 6 }}>✦ Brand Summary</p>
                                    <p style={{ fontSize: 13, color: '#aaa', margin: 0 }}>{brandName || 'Brand name'} · {industry || 'Industry'}</p>
                                    {website && <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{website}</p>}
                                </div>
                                <div style={{ background: `${P}08`, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16 }}>
                                    <p style={{ fontSize: 13, color: '#888', margin: 0 }}>📋 You can add your logo, cover image, and more details from your Brand Profile after setup.</p>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {error && <p style={{ color: '#f87171', fontSize: 13, marginTop: 16, background: '#f8717115', padding: '10px 14px', borderRadius: 8 }}>{error}</p>}
            </main>

            {/* Footer CTA */}
            <div style={{ padding: '12px 20px 32px', display: 'flex', gap: 12 }}>
                {step > 1 && (
                    <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: '14px 0', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 12, color: '#ccc', fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>Back</button>
                )}
                {step < totalSteps ? (
                    <button onClick={() => setStep(s => s + 1)} style={{ flex: 2, padding: '15px 0', background: P, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 6px 24px ${P}40` }}>Continue →</button>
                ) : (
                    <button onClick={finish} disabled={loading} style={{ flex: 2, padding: '15px 0', background: P, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1, boxShadow: `0 6px 24px ${P}40` }}>
                        {loading ? 'Setting up…' : '🚀 Launch My Profile'}
                    </button>
                )}
            </div>
        </div>
    );
}
