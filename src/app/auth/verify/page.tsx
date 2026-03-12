'use client';
import { useState } from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const P = '#d125f4';
const BG = '#1f1022';
const BORDER = '#4a2d52';

function VerifyContent() {
    const params = useSearchParams();
    const email = params.get('email') ?? '';
    const [loading, setLoading] = useState(false);
    async function resend() {
        setLoading(true);
        // Firebase Auth resend logic would go here
        // E.g., fetch('/api/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) })
        await new Promise(r => setTimeout(r, 1000));
        setLoading(false);
    }

    return (
        <div style={{ minHeight: '100dvh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Spline Sans', sans-serif" }}>
            <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${P}20`, border: `2px solid ${P}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 24px' }}>📧</div>
                <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 10 }}>Check your email</h1>
                <p style={{ color: '#888', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
                    We sent a verification link to<br />
                    <strong style={{ color: '#ccc' }}>{email}</strong>
                </p>
                <div style={{ background: `${P}08`, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, marginBottom: 28, textAlign: 'left' }}>
                    <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6, margin: 0 }}>
                        Click the link in the email to activate your account. Check spam if you don&apos;t see it in a few minutes.
                    </p>
                </div>
                <button onClick={resend} disabled={loading} style={{ width: '100%', padding: '14px 0', background: 'transparent', border: `1px solid ${P}50`, borderRadius: 12, color: P, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 14 }}>
                    {loading ? 'Sending…' : 'Resend Email'}
                </button>
                <a href="/auth/login" style={{ display: 'block', color: '#666', fontSize: 14, textDecoration: 'none' }}>← Back to sign in</a>
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return <Suspense><VerifyContent /></Suspense>;
}
