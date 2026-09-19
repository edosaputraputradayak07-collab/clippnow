'use client';

import { useState } from 'react';

const PACKAGES = [{ credits: 10, price: 'Rp25.000', label: 'Starter' }, { credits: 30, price: 'Rp65.000', label: 'Creator' }, { credits: 100, price: 'Rp190.000', label: 'Pro' }];

export function PackagePicker() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState<number | null>(null);
  async function checkout(credits: number) {
    setLoading(credits); setMessage('');
    try {
      const response = await fetch('/api/payments/create', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ credits }) });
      const body = await response.json() as { error?: string; payment?: { checkoutUrl: string | null } };
      if (!response.ok) throw new Error(body.error || 'PAYMENT_FAILED');
      if (body.payment?.checkoutUrl) window.location.href = body.payment.checkoutUrl;
      else setMessage('Payment berhasil dibuat. Tunggu instruksi checkout dari provider.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'PAYMENT_FAILED'); }
    finally { setLoading(null); }
  }
  return <><section className="clip-grid">{PACKAGES.map((pack) => <article className="clip-card" key={pack.credits}><div className="clip-content"><p className="eyebrow">{pack.label}</p><h2>{pack.credits} Credits</h2><p>{pack.price}</p><button className="primary-button" type="button" disabled={loading !== null} onClick={() => checkout(pack.credits)}>{loading === pack.credits ? 'Memproses…' : 'Beli Credits'}</button></div></article>)}</section>{message ? <p className="success-message" role="status">{message}</p> : null}</>;
}
