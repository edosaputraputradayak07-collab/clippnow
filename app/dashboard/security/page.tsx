import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function SecurityCenterPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  if (profile?.plan !== 'owner') redirect('/dashboard');

  const { data: events } = await supabase
    .from('security_events')
    .select('id,created_at,event_type,severity,ip_address,endpoint,message,blocked')
    .order('created_at', { ascending: false })
    .limit(100);

  const critical = events?.filter((e) => e.severity === 'critical').length ?? 0;
  const high = events?.filter((e) => e.severity === 'high').length ?? 0;
  const blocked = events?.filter((e) => e.blocked).length ?? 0;

  return (
    <main className="min-h-screen bg-[#05070d] text-white">
      <div className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <a href="/dashboard" className="text-xl font-black">Clipp<span className="text-cyan-300">Now</span></a>
            <div className="mt-8 text-xs font-black uppercase tracking-[0.18em] text-red-300">Owner Security Center</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Pertahanan ClippNow</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Percobaan akses sensitif dicatat dan dapat dibatasi oleh sistem. Data di halaman ini hanya tersedia untuk akun owner.</p>
          </div>
          <a href="/dashboard" className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-black text-slate-300 hover:bg-white/[0.04]">← Dashboard</a>
        </header>

        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          <Stat label="Critical" value={critical} />
          <Stat label="High Risk" value={high} />
          <Stat label="Blocked" value={blocked} />
        </section>

        <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
          <div className="border-b border-white/10 px-6 py-5">
            <h2 className="text-lg font-black">Security events</h2>
            <p className="mt-1 text-xs text-slate-600">100 kejadian keamanan terbaru.</p>
          </div>
          {events?.length ? (
            <div className="divide-y divide-white/5">
              {events.map((event) => (
                <div key={event.id} className="grid gap-3 px-6 py-5 lg:grid-cols-[150px_100px_1fr_150px] lg:items-center">
                  <div className="text-xs text-slate-500">{new Date(event.created_at).toLocaleString('id-ID')}</div>
                  <div><span className="rounded-full border border-white/10 px-2 py-1 text-[9px] font-black uppercase">{event.severity}</span></div>
                  <div><div className="text-sm font-bold">{event.event_type}</div><p className="mt-1 text-xs text-slate-500">{event.message}</p><div className="mt-2 text-[10px] text-slate-700">{event.endpoint || '—'} • {event.ip_address || 'IP tidak tersedia'}</div></div>
                  <div className="text-xs font-black lg:text-right">{event.blocked ? <span className="text-emerald-300">BLOCKED</span> : <span className="text-slate-600">LOGGED</span>}</div>
                </div>
              ))}
            </div>
          ) : <div className="p-12 text-center text-sm text-slate-600">Belum ada security event.</div>}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6"><div className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-600">{label}</div><div className="mt-2 text-3xl font-black">{value}</div></div>;
}
