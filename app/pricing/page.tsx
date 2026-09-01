'use client';

import { useState } from 'react';

const plans = [
  { id: 'starter', name: 'Starter', price: '49.000', credits: 10, description: 'Untuk creator yang baru mulai.', features: ['10 clip credits', '9:16, 1:1, 16:9', 'Project history', 'Download hasil'], featured: false },
  { id: 'creator', name: 'Creator', price: '99.000', credits: 30, description: 'Pilihan paling seimbang untuk creator aktif.', features: ['30 clip credits', 'Semua format', 'Project history', 'Prioritas processing'], featured: true },
  { id: 'pro', name: 'Pro', price: '199.000', credits: 100, description: 'Untuk kebutuhan konten volume tinggi.', features: ['100 clip credits', 'Semua format', 'Project history', 'Prioritas processing', 'Lebih banyak project'], featured: false },
] as const;

export default function PricingPage() {
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  async function checkout(plan: string) {
    setLoading(plan);
    setError('');
    const response = await fetch('/api/payments/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error ?? 'Checkout gagal. Pastikan kamu sudah login.');
      setLoading('');
      return;
    }
    window.location.href = data.redirect_url;
  }

  return (
    <main className="min-h-screen bg-[#05070d] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <a href="/" className="inline-flex items-center gap-2 text-sm font-black">← Clipp<span className="text-cyan-300">Now</span></a>
        <div className="mx-auto max-w-2xl py-16 text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">ClippNow Credits</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Pilih paket. Bayar. Langsung bikin clip.</h1>
          <p className="mt-5 text-sm leading-7 text-slate-500 sm:text-base">Setiap paket menambah kredit ke akun. Kredit hanya bertambah setelah payment gateway mengonfirmasi pembayaran berhasil.</p>
        </div>
        {error && <div className="mx-auto mb-6 max-w-2xl rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-center text-xs font-semibold text-rose-300">{error}</div>}
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.id} className={`relative rounded-3xl border p-7 ${plan.featured ? 'border-cyan-300/40 bg-cyan-300/[0.06] shadow-xl shadow-cyan-950/20' : 'border-white/10 bg-white/[0.025]'}`}>
              {plan.featured && <span className="absolute right-5 top-5 rounded-full bg-cyan-300 px-3 py-1 text-[9px] font-black text-slate-950">PALING POPULER</span>}
              <h2 className="text-lg font-black">{plan.name}</h2>
              <div className="mt-6 text-4xl font-black">Rp{plan.price}<span className="text-xs text-slate-600"> / paket</span></div>
              <div className="mt-2 text-sm font-black text-cyan-300">{plan.credits} credits</div>
              <p className="mt-4 min-h-10 text-xs leading-5 text-slate-500">{plan.description}</p>
              <ul className="mt-6 space-y-3 text-xs text-slate-300">{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
              <button type="button" onClick={() => checkout(plan.id)} disabled={Boolean(loading)} className="mt-8 w-full rounded-xl bg-cyan-300 px-4 py-3 text-xs font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-50">{loading === plan.id ? 'Membuka pembayaran…' : 'Beli sekarang →'}</button>
            </article>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-3xl text-center text-[11px] leading-5 text-slate-600">Pembayaran menggunakan Midtrans. Untuk produksi, isi credential Midtrans di environment Vercel dan arahkan Payment Notification URL ke <code>/api/payments/webhook</code>.</p>
      </div>
    </main>
  );
}
