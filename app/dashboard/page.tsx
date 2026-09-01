const projects = [
  { name: 'Belum ada project', meta: 'Upload video pertama untuk mulai.', state: 'READY' },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#05070d] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-64 border-r border-white/10 p-6 md:block">
          <a href="/" className="text-xl font-black">Clipp<span className="text-cyan-300">Now</span></a>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-600">Creator workspace</p>
          <nav className="mt-10 space-y-2 text-sm font-semibold">
            <a href="/dashboard" className="block rounded-xl bg-cyan-300/10 px-4 py-3 text-cyan-200">Studio</a>
            <a href="#projects" className="block rounded-xl px-4 py-3 text-slate-500 hover:bg-white/[0.04] hover:text-white">Projects</a>
            <a href="/pricing" className="block rounded-xl px-4 py-3 text-slate-500 hover:bg-white/[0.04] hover:text-white">Buy credits</a>
          </nav>
        </aside>

        <section className="flex-1 p-5 sm:p-8 lg:p-10">
          <header className="flex items-center justify-between border-b border-white/10 pb-6">
            <div><div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Creator dashboard</div><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Workspace kamu</h1></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-right"><div className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Credits</div><div className="text-lg font-black text-white">0</div></div>
          </header>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
            <a href="/#studio" className="group rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-300/[0.09] to-violet-400/[0.04] p-7 transition hover:border-cyan-300/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-xl font-black text-slate-950">+</div>
              <h2 className="mt-8 text-2xl font-black">Buat clip baru</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Upload video, tentukan range, pilih format, lalu lanjutkan ke processing.</p>
              <div className="mt-6 text-xs font-black text-cyan-200">OPEN STUDIO →</div>
            </a>
            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-7"><div className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">Account status</div><div className="mt-4 text-lg font-black">Free / Trial</div><p className="mt-2 text-xs leading-5 text-slate-500">Upgrade untuk mendapatkan credits dan akses processing.</p><a href="/pricing" className="mt-6 inline-flex rounded-xl bg-white/[0.06] px-4 py-2.5 text-xs font-black text-white hover:bg-white/[0.1]">Lihat paket</a></div>
          </div>

          <section id="projects" className="mt-10">
            <div className="flex items-center justify-between"><div><h2 className="text-lg font-black">Projects</h2><p className="mt-1 text-xs text-slate-600">Riwayat clip yang pernah dibuat.</p></div><span className="text-[10px] font-bold text-slate-600">0 PROJECT</span></div>
            <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-8 text-center"><div className="text-sm font-bold text-slate-400">{projects[0].name}</div><p className="mt-2 text-xs text-slate-600">{projects[0].meta}</p></div>
          </section>
        </section>
      </div>
    </main>
  );
}
