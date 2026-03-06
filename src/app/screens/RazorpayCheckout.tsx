'use client';
import { useState } from 'react';
import { P_COLOR as P, BORDER } from './ui';

declare global {
    interface Window {
        Razorpay: new (opts: Record<string, unknown>) => { open(): void };
    }
}

interface Props {
    amount: number;        // ₹ amount
    gigOrderId?: string;
    buyerId?: string;
    sellerId?: string;
    description?: string;
    onSuccess: (paymentId: string) => void;
    onDismiss?: () => void;
}

function loadRazorpay(): Promise<boolean> {
    return new Promise(resolve => {
        if (window.Razorpay) { resolve(true); return; }
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.body.appendChild(s);
    });
}

export default function RazorpayCheckout({ amount, gigOrderId, buyerId, sellerId, description, onSuccess, onDismiss }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function initiate() {
        setLoading(true); setError('');

        const loaded = await loadRazorpay();
        if (!loaded) { setError('Razorpay SDK failed to load. Check your internet connection.'); setLoading(false); return; }

        // 1 — Create order on server
        const res = await fetch('/api/payments/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, gigOrderId, notes: { description } }),
        });
        const order = await res.json();
        if (!res.ok) { setError(order.error ?? 'Failed to create order'); setLoading(false); return; }

        // 2 — Open Razorpay checkout
        const rz = new window.Razorpay({
            key: order.keyId,
            amount: order.amount,
            currency: order.currency,
            order_id: order.orderId,
            name: 'Nova Logic Studio',
            description: description ?? 'Gig Payment',
            theme: { color: P },
            modal: { ondismiss: () => { setLoading(false); onDismiss?.(); } },
            handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
                // 3 — Verify on server
                const verifyRes = await fetch('/api/payments/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...response, gigOrderId, buyerId, sellerId, amount }),
                });
                const result = await verifyRes.json();
                setLoading(false);
                if (result.success) onSuccess(result.paymentId);
                else setError(result.error ?? 'Payment verification failed');
            },
        });
        rz.open();
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={initiate} disabled={loading} style={{
                width: '100%', padding: '15px 0', background: loading ? `${P}60` : P,
                border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700,
                fontSize: 16, cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
                {loading ? '…' : `💳 Pay ₹${amount.toLocaleString('en-IN')}`}
            </button>
            {error && <p style={{ color: '#f87171', fontSize: 13, background: '#f8717115', padding: '8px 12px', borderRadius: 8, margin: 0 }}>{error}</p>}
            <p style={{ fontSize: 11, color: '#555', textAlign: 'center', margin: 0 }}>Secured by Razorpay · UPI · Cards · NetBanking</p>
        </div>
    );
}
