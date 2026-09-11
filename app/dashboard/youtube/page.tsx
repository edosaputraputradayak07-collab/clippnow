import { createClient } from '@/lib/supabase/server';
import { listYouTubeAccounts, listYouTubeVideos } from '@/lib/youtube/client';

export default async function YouTubePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let accounts: Awaited<ReturnType<typeof listYouTubeAccounts>> = [];
  let videos: Awaited<ReturnType<typeof listYouTubeVideos>> = [];
  try {
    accounts = await listYouTubeAccounts(user.id);
    if (accounts.length) videos = await listYouTubeVideos(user.id, 20);
  } catch {
    // The page remains usable and shows the connect action when configuration is incomplete.
  }

  return (
    <main className="min-h-screen bg-[#05070d] px-4 py-6 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div><a href="/dashboard" className="text-xl font-black">Vid<span className="text-cyan-300">klipral</span></a><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-600">YouTube workspace</p></div>
          <a href="/dashboard/create" className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white">Create clip</a>
        </header>

        <section className="mt-8 rounded-[2rem] border border-cyan-300/15 bg-gradient-to-br from-cyan-300/[.08] via-white/[.02] to-violet-400/[.07] p-6 sm:p-8">
          <div className="max-w-3xl">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">YouTube Registration</div>
            <h1 className="mt-3 text-3xl font-black sm:text-5xl">Hubungkan channel YouTube kamu.</h1>
            <p className="mt-4 text-sm leading-6 text-slate-500">Login dengan Google, izinkan akses YouTube read-only, lalu ClippNow akan menampilkan channel dan video yang bisa kamu pilih untuk dibuat menjadi viral clips.</p>
            <a href="/api/youtube/connect" className="mt-6 inline-flex rounded-xl bg-cyan-300 px-5 py-3 text-xs font-black text-slate-950 hover:bg-cyan-200">▶ Connect YouTube</a>
            <p className="mt-3 text-[10px] text-slate-600">Aplikasi meminta akses baca YouTube saja. Password Google tidak pernah masuk ke ClippNow.</p>
          </div>
        </section>

        {accounts.length > 0 && <section className="mt-6">
          <h2 className="text-lg font-black">Channel terhubung</h2>
          <div className="mt-3 rounded-2xl border border-emerald-300/15 bg-emerald-300/[.04] p-5">
            <div className="flex items-center gap-4">
              {accounts[0].channel_thumbnail_url ? <img src={accounts[0].channel_thumbnail_url} alt="" className="h-14 w-14 rounded-full" /> : <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-300 text-xl font-black text-slate-950">▶</div>}
              <div><div className="font-black">{accounts[0].channel_title}</div><div className="mt-1 text-xs text-slate-600">Channel ID: {accounts[0].channel_id}</div></div>
            </div>
          </div>
        </section>}

        {videos.length > 0 && <section className="mt-8">
          <div className="flex items-end justify-between"><div><h2 className="text-lg font-black">Video terbaru</h2><p className="mt-1 text-xs text-slate-600">Pilih video untuk diproses menjadi clip.</p></div><span className="text-[10px] font-bold text-slate-600">{videos.length} VIDEO</span></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map(video => <article key={video.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.025]">
              {video.thumbnail && <img src={video.thumbnail} alt="" className="aspect-video w-full object-cover" />}
              <div className="p-4"><h3 className="line-clamp-2 text-sm font-bold">{video.title}</h3><p className="mt-2 text-[10px] text-slate-600">{video.publishedAt ? new Date(video.publishedAt).toLocaleDateString('id-ID') : ''}</p><a href={`/dashboard/create?youtube=${encodeURIComponent(`https://www.youtube.com/watch?v=${video.id}`)}`} className="mt-4 inline-flex rounded-lg bg-cyan-300 px-3 py-2 text-[10px] font-black text-slate-950">Buat Viral Clip →</a></div>
            </article>)}
          </div>
        </section>}

        {accounts.length === 0 && <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-8 text-center"><div className="text-sm font-bold text-slate-400">Belum ada channel terhubung</div><p className="mt-2 text-xs text-slate-600">Klik Connect YouTube untuk mulai.</p></div>}
      </div>
    </main>
  );
}
