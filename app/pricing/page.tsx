const plans = [
  { name: 'Starter', price: '49.000', credits: 10, description: 'Untuk creator yang baru mulai membangun workflow.', features: ['10 clip credits', 'Semua format dasar', 'Project history', 'Download hasil'], featured: false },
  { name: 'Creator', price: '99.000', credits: 30, description: 'Pilihan paling seimbang untuk creator aktif.', features: ['30 clip credits', '9:16, 1:1, 16:9', 'Project history', 'Prioritas processing'], featured: true },
  { name: 'Pro', price: '199.000', credits: 100, description: 'Untuk kebutuhan konten dengan volume tinggi.', features: ['100 clip credits', 'Semua format', 'Project history', 'Prioritas processing', 'Lebih banyak project'], featured: false },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#05070d] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <a href="/" className="inline-flex items-center gap-2 text-sm font-black text-white">← Clipp<span className="text-cyan-300">Now</span></a>
        <div className="mx-auto max-w-2xl py-16 text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">ClippNow Credits</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Pilih paket. Beli kredit. Mulai clipping.</h1>
          <p className="mt-5 text-sm leading-7 text-slate-500 sm:text-base">Sistem kredit membuat biaya sederhana: satu kredit digunakan untuk satu proses clip setelah engine processing aktif.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className={`relative rounded-3xl border p-7 ${plan.featured ? 'border-cyan-300/40 bg-cyan-300/[0.06]' : 'border-white/10 bg-white/[0.025]'}`}>
              {plan.featured && <span className="absolute right-5 top-5 rounded-full bg-cyan-300 px-3 py-1 text-[9px] font-black text-slate-950">PALING POPULER</span>}
              <h2 className="text-lg font-black">{plan.name}</h2>
              <div className="mt-6 text-4xl font-black">Rp{plan.price}<span className="text-xs text-slate-600"> / paket</span></div>
              <div className="mt-2 text-sm font-black text-cyan-300">{plan.credits} credits</div>
              <p className="mt-4 min-h-12 text-xs leading-5 text-slate-500">{plan.description}</p>
              <ul className="mt-6 space-y-3 text-xs text-slate-300">
                {plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}
              </ul>
              <button type="button" disabled className="mt-8 w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black text-slate-500">Checkout segera tersedia</button>
            </article>
          ))}
        </div>
        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-amber-300/10 bg-amber-300/[0.04] p-4 text-center text-xs leading-6 text-amber-200/70">Payment gateway belum diaktifkan pada tahap ini. Tombol checkout sengaja dinonaktifkan agar tidak memberi kesan pembayaran sudah benar-benar berjalan.</div>
      </div>
    </main>
  );
}
