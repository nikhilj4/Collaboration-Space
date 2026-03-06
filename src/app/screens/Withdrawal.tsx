'use client';
import { useState } from 'react';
import { Scr } from './types';
import { Icon, P_COLOR as P, BG, BORDER, CARD } from './ui';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store';

const inp = {
    width: '100%', background: `${P}0a`, border: `1px solid ${BORDER}`,
    borderRadius: 12, padding: '13px 15px', color: '#eee', fontSize: 14,
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const,
};

const BANKS = ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Mahindra', 'Yes Bank', 'Punjab National Bank', 'Other'];

export default function WithdrawalScreen({ go }: { go: (s: Scr) => void }) {
    const { user } = useAuthStore();
    const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
    const [amount, setAmount] = useState('');
    const [accountName, setAccountName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [bank, setBank] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function submit() {
        if (!user) return;
        setLoading(true); setError('');
        const supabase = createClient();

        // Get wallet
        const { data: wallet } = await supabase.from('wallets').select('id, balance').eq('user_id', user.id).single();
        if (!wallet) { setError('Wallet not found.'); setLoading(false); return; }

        const withdrawAmount = parseFloat(amount);
        if (withdrawAmount > wallet.balance) { setError('Insufficient balance.'); setLoading(false); return; }
        if (withdrawAmount < 100) { setError('Minimum withdrawal is ₹100.'); setLoading(false); return; }

        // Upsert bank account
        await supabase.from('bank_accounts').upsert({
            user_id: user.id, account_name: accountName,
            account_number: accountNumber, ifsc_code: ifsc, bank_name: bank,
        }, { onConflict: 'user_id,account_number' });

        // Create debit transaction
        await supabase.from('transactions').insert({
            wallet_id: wallet.id, type: 'debit',
            amount: withdrawAmount,
            description: `Withdrawal to ${bank} ****${accountNumber.slice(-4)}`,
            reference_type: 'withdrawal', status: 'pending',
        });

        // Decrement wallet balance
        await supabase.from('wallets').update({ balance: wallet.balance - withdrawAmount, total_withdrawn: (wallet as any).total_withdrawn + withdrawAmount }).eq('id', wallet.id);

        setStep('success');
        setLoading(false);
    }

    if (step === 'success') {
        return (
            <div style={{ minHeight: '100dvh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
                <div style={{ fontSize: 60 }}>🏦</div>
                <h2 style={{ fontSize: 22, fontWeight: 800 }}>Withdrawal Requested!</h2>
                <p style={{ color: '#888', textAlign: 'center', fontSize: 14, lineHeight: 1.6 }}>
                    ₹{parseFloat(amount).toLocaleString('en-IN')} will be transferred to<br />
                    <strong style={{ color: '#eee' }}>{bank} ****{accountNumber.slice(-4)}</strong><br />
                    within 3–5 business days.
                </p>
                <button onClick={() => go('wallet')} style={{ padding: '13px 36px', background: P, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }}>
                    Back to Wallet
                </button>
            </div>
        );
    }

    if (step === 'confirm') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: BG }}>
                <header style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: `1px solid ${BORDER}30` }}>
                    <button onClick={() => setStep('form')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' }}>
                        <Icon n="arrow_back" style={{ fontSize: 22 }} />
                    </button>
                    <span style={{ fontWeight: 700, fontSize: 18 }}>Confirm Withdrawal</span>
                </header>
                <main style={{ flex: 1, padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ background: `${CARD}80`, borderRadius: 20, padding: 24, border: `1px solid ${P}20` }}>
                        {[
                            { label: 'Amount', value: `₹${parseFloat(amount).toLocaleString('en-IN')}` },
                            { label: 'Bank', value: bank },
                            { label: 'Account', value: `****${accountNumber.slice(-4)}` },
                            { label: 'IFSC', value: ifsc.toUpperCase() },
                            { label: 'Name', value: accountName },
                        ].map(r => (
                            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${BORDER}20` }}>
                                <span style={{ color: '#666', fontSize: 14 }}>{r.label}</span>
                                <span style={{ fontWeight: 700, fontSize: 14 }}>{r.value}</span>
                            </div>
                        ))}
                    </div>
                    <p style={{ fontSize: 12, color: '#555', textAlign: 'center', lineHeight: 1.6 }}>
                        This withdrawal will be processed within 3–5 business days. Platform fee of 2% applies.
                    </p>
                    {error && <p style={{ color: '#f87171', fontSize: 13, background: '#f8717115', padding: '10px 14px', borderRadius: 8 }}>{error}</p>}
                    <button onClick={submit} disabled={loading} style={{ width: '100%', padding: '15px 0', background: P, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8, opacity: loading ? 0.6 : 1 }}>
                        {loading ? 'Processing…' : '✅ Confirm Withdrawal'}
                    </button>
                </main>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: BG }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: `1px solid ${BORDER}30` }}>
                <button onClick={() => go('wallet')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' }}>
                    <Icon n="arrow_back" style={{ fontSize: 22 }} />
                </button>
                <span style={{ fontWeight: 700, fontSize: 18 }}>Withdraw Funds</span>
            </header>

            <main style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>
                {/* Amount */}
                <div style={{ background: `${CARD}80`, borderRadius: 20, padding: 24, border: `1px solid ${P}15`, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Enter Amount</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <span style={{ fontSize: 32, fontWeight: 700, color: '#888' }}>₹</span>
                        <input
                            style={{ background: 'none', border: 'none', outline: 'none', fontSize: 42, fontWeight: 800, color: '#fff', width: 200, textAlign: 'center', fontFamily: 'inherit' }}
                            type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)}
                        />
                    </div>
                    <div style={{ fontSize: 12, color: '#555', marginTop: 8 }}>Min ₹100 · No max limit</div>
                    {/* Quick amounts */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
                        {['500', '1000', '2500', '5000'].map(q => (
                            <button key={q} onClick={() => setAmount(q)} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${BORDER}`, background: amount === q ? `${P}25` : 'transparent', color: amount === q ? P : '#777', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                ₹{q}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bank details */}
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: -6 }}>Bank Details</h3>
                <div>
                    <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Bank</label>
                    <select style={{ ...inp }} value={bank} onChange={e => setBank(e.target.value)}>
                        <option value="">Select bank…</option>
                        {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Account Holder Name</label>
                    <input style={inp} placeholder="As per bank records" value={accountName} onChange={e => setAccountName(e.target.value)} />
                </div>
                <div>
                    <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Account Number</label>
                    <input style={inp} type="tel" placeholder="1234567890" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
                </div>
                <div>
                    <label style={{ fontSize: 12, color: '#888', fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>IFSC Code</label>
                    <input style={inp} placeholder="HDFC0001234" value={ifsc} onChange={e => setIfsc(e.target.value.toUpperCase())} maxLength={11} />
                </div>

                {error && <p style={{ color: '#f87171', fontSize: 13, background: '#f8717115', padding: '10px 14px', borderRadius: 8 }}>{error}</p>}
            </main>

            <div style={{ padding: '12px 16px 32px' }}>
                <button
                    onClick={() => {
                        if (!amount || !accountName || !accountNumber || !ifsc || !bank) { setError('Fill all fields.'); return; }
                        setError(''); setStep('confirm');
                    }}
                    style={{ width: '100%', padding: '15px 0', background: P, border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Review Withdrawal →
                </button>
            </div>
        </div>
    );
}
