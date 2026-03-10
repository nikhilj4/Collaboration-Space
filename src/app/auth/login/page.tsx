'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';

const P = '#d125f4';
const BG = '#1f1022';
const CARD = '#2d1b31';
const BORDER = '#4a2d52';

const inp = {
    width: '100%', background: `${P}0a`, border: `1px solid ${BORDER}`,
    borderRadius: 12, padding: '14px 16px', color: '#eee', fontSize: 15,
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const,
};

export default function LoginPage() {
    const [tab, setTab] = useState<'email' | 'phone'>('email');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const supabase = createClient();
    const { loadSession } = useAuthStore();

    async function handleEmailLogin(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
            setError(signInError.message);
            setLoading(false);
            return;
        }
        // Load session into store then navigate
        await loadSession();
        router.push('/');
        router.refresh();
    }

    async function handleSendOtp() {
        setError(''); setLoading(true);
        const res = await fetch('/api/auth/otp', { method: 'POST', body: JSON.stringify({ phone }), headers: { 'Content-Type': 'application/json' } });
        const data = await res.json();
        if (!res.ok) setError(data.error);
        else setOtpSent(true);
        setLoading(false);
    }

    async function handleVerifyOtp(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        const { error: otpError } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
        if (otpError) {
            setError(otpError.message);
            setLoading(false);
            return;
        }
        await loadSession();
        router.push('/');
        router.refresh();
        setLoading(false);
    }

    async function handleGoogle() {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/api/auth/callback` },
        });
    }

    return (
        <div style={{ minHeight: '100dvh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Spline Sans', sans-serif" }}>
            <div style={{ width: '100%', maxWidth: 400 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>✦</div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Welcome back</h1>
                    <p style={{ color: '#888', fontSize: 15 }}>Sign in to Nova Logic Studio</p>
                </div>

                {/* Google */}
                <button onClick={handleGoogle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '14px 0', background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`, borderRadius: 14, color: '#eee', fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20 }}>
                    <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.1 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 7.1 29 5 24 5 13 5 4 14 4 25s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" /><path fill="#FF3D00" d="m6.3 15.5 6.6 4.8C14.5 17 19 14 24 14c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 7.1 29 5 24 5c-7.8 0-14.5 4.3-17.7 10.5z" /><path fill="#4CAF50" d="M24 45c5 0 9.5-1.9 12.9-5l-6-4.9C29 37 26.6 38 24 38c-5.2 0-9.7-3-11.3-7.2l-6.5 5C9.5 41 16.3 45 24 45z" /><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l.1-.1 6 4.9c-.4.4 6.9-5 6.9-13.5 0-1.3-.1-2.6-.4-3.9z" /></svg>
                    Continue with Google
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ flex: 1, height: 1, background: BORDER }} />
                    <span style={{ color: '#555', fontSize: 13 }}>or</span>
                    <div style={{ flex: 1, height: 1, background: BORDER }} />
                </div>

                {/* Tab */}
                <div style={{ display: 'flex', background: `${P}12`, borderRadius: 10, padding: 4, marginBottom: 20 }}>
                    {(['email', 'phone'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: tab === t ? P : 'transparent', color: tab === t ? '#fff' : '#888', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>{t}</button>
                    ))}
                </div>

                {tab === 'email' ? (
                    <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <input style={inp} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
                        <input style={inp} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                        {error && <p style={{ color: '#f87171', fontSize: 13, background: '#f8717120', padding: '10px 14px', borderRadius: 8 }}>{error}</p>}
                        <button type="submit" disabled={loading} style={{ padding: '15px 0', background: P, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1, boxShadow: `0 6px 24px ${P}40` }}>
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <input style={{ ...inp, flex: 1 }} type="tel" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} disabled={otpSent} />
                            {!otpSent && <button onClick={handleSendOtp} disabled={loading || phone.length < 8} style={{ padding: '0 18px', background: P, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', opacity: phone.length < 8 ? 0.5 : 1 }}>Send OTP</button>}
                        </div>
                        {otpSent && (
                            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <input style={{ ...inp, textAlign: 'center', fontSize: 24, letterSpacing: 12 }} maxLength={6} placeholder="······" value={otp} onChange={e => setOtp(e.target.value)} required />
                                {error && <p style={{ color: '#f87171', fontSize: 13 }}>{error}</p>}
                                <button type="submit" disabled={loading} style={{ padding: '15px 0', background: P, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    {loading ? 'Verifying…' : 'Verify OTP'}
                                </button>
                            </form>
                        )}
                    </div>
                )}

                <p style={{ textAlign: 'center', color: '#666', fontSize: 14, marginTop: 24 }}>
                    Don&apos;t have an account?{' '}
                    <a href="/auth/signup" style={{ color: P, fontWeight: 700, textDecoration: 'none' }}>Sign up</a>
                </p>
            </div>
        </div>
    );
}
