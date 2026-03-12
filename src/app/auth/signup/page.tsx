'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuthStore } from '@/lib/store';

const P = '#d125f4';
const BG = '#1f1022';
const BORDER = '#4a2d52';

const inp = {
    width: '100%', background: `${P}0a`, border: `1px solid ${BORDER}`,
    borderRadius: 12, padding: '14px 16px', color: '#eee', fontSize: 15,
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const,
};

export default function SignupPage() {
    const [step, setStep] = useState<1 | 2>(1);
    const [role, setRole] = useState<'creator' | 'brand'>('creator');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const { loadSession } = useAuthStore();

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, full_name: fullName, role }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? 'Signup failed. Please try again.');
                return;
            }
            // Sign in with the custom token returned from the server
            const credential = await signInWithCustomToken(auth, data.customToken);
            const idToken = await credential.user.getIdToken();
            // Persist server-side session cookie
            await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });
            await loadSession();
            router.push('/onboarding');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ minHeight: '100dvh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Spline Sans', sans-serif" }}>
            <div style={{ width: '100%', maxWidth: 400 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>✦</div>
                    <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Create your account</h1>
                    <p style={{ color: '#888', fontSize: 14 }}>Step {step} of 2</p>
                </div>

                {/* Progress bar */}
                <div style={{ height: 4, background: BORDER, borderRadius: 999, marginBottom: 28, overflow: 'hidden' }}>
                    <div style={{ width: step === 1 ? '50%' : '100%', height: '100%', background: P, transition: 'width 0.3s' }} />
                </div>

                {step === 1 ? (
                    <div>
                        <p style={{ color: '#ccc', fontSize: 15, marginBottom: 20, textAlign: 'center' }}>I am joining as a…</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                            {[
                                { r: 'creator' as const, icon: '🎨', title: 'Creator / Influencer', desc: 'Monetize your audience, land brand deals, and grow your career' },
                                { r: 'brand' as const, icon: '🏢', title: 'Brand / Business', desc: 'Find influencers, run campaigns, and measure real ROI' },
                            ].map(({ r, icon, title, desc }) => (
                                <button key={r} onClick={() => setRole(r)} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: 18, background: role === r ? `${P}18` : `${P}05`, border: `${role === r ? 2 : 1}px solid ${role === r ? P : BORDER}`, borderRadius: 16, cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.2s' }}>
                                    <span style={{ fontSize: 32 }}>{icon}</span>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 16, color: role === r ? '#fff' : '#ccc' }}>{title}</div>
                                        <div style={{ fontSize: 13, color: '#666', marginTop: 4, lineHeight: 1.4 }}>{desc}</div>
                                    </div>
                                    {role === r && <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: P, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>✓</div>}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setStep(2)} style={{ width: '100%', padding: '15px 0', background: P, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 6px 24px ${P}40` }}>
                            Continue as {role === 'creator' ? 'Creator' : 'Brand'}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                            <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Full Name</label>
                            <input style={inp} placeholder="Your name" value={fullName} onChange={e => setFullName(e.target.value)} required minLength={2} />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</label>
                            <input style={inp} type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Password</label>
                            <input style={inp} type="password" placeholder="Min 8 chars, uppercase & number" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
                        </div>
                        {error && <p style={{ color: '#f87171', fontSize: 13, background: '#f8717120', padding: '10px 14px', borderRadius: 8 }}>{error}</p>}
                        <button type="submit" disabled={loading} style={{ padding: '15px 0', background: P, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1, boxShadow: `0 6px 24px ${P}40`, marginTop: 6 }}>
                            {loading ? 'Creating account…' : 'Create Account'}
                        </button>
                        <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>← Back</button>
                    </form>
                )}

                <p style={{ textAlign: 'center', color: '#666', fontSize: 14, marginTop: 24 }}>
                    Already have an account?{' '}
                    <a href="/auth/login" style={{ color: P, fontWeight: 700, textDecoration: 'none' }}>Sign in</a>
                </p>
            </div>
        </div>
    );
}
