'use client';

import { useEffect, useState } from 'react';
import { isYouTubeUrl } from '@/lib/youtube-url';

type Clip = { videoId: number | string; videoUrl: string; videoMsDuration?: number; title?: string; viralScore?: string; viralReason?: string; thumbnailUrl?: string };

type Props = { plan: string };

export default function YouTubeImportStudio({ plan }: Props) {
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [clips, setClips] = useState<Clip[]>([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const valid = isYouTubeUrl(link);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const response = await fetch(`/api/youtube/lumiclip?project_id=${encodeURIComponent(projectId)}`, { cache: 'no-store' });
        const data = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (!response.ok) throw new Error(data.error ?? 'Gagal mengambil hasil AI.');
        if (data.status === 'complete') {
          const nextClips = Array.isArray(data.videos) ? data.videos : [];
          setClips(nextClips);
          setBusy(false);
          setStatus(`${nextClips.length} clip selesai dibuat.`);
          return;
        }
        setStatus('AI sedang menganalisis, memilih momen viral, membuat subtitle, dan format 9:16…');
        timer = setTimeout(poll, 10000);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Gagal mengambil hasil AI.');
          setBusy(false);
        }
      }
    };
    poll();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [projectId]);

  async function start() {
    if (!valid || busy) {
      if (!valid) setError('Masukkan link YouTube yang valid terlebih dahulu.');
      return;
    }
    setBusy(true); setError(''); setClips([]); setProjectId(''); setStatus('Mengirim link YouTube ke AI engine…');
    try {
      const response = await fetch('/api/youtube/lumiclip', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_url: link.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? 'Gagal memulai proses YouTube.');
      setProjectId(String(data.provider_project_id));
      setStatus('Video diterima. AI mulai mencari momen terbaik…');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Terjadi kesalahan.');
      setBusy(false);
    }
  }

  return (
    <section className="mb-6 overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-cyan-300/[0.035] p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">YouTube AI Import</div>
          <h2 className="mt-2 text-2xl font-black sm:text-3xl">Tempel link YouTube → langsung jadi clip.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Tidak perlu download lalu upload manual. Vidklipral mengirim URL ke LumiClip, lalu mengambil hasil AI kembali ke dashboard.</p>
        </div>
        <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex gap-2"><input value={link} onChange={event => { setLink(event.target.value); setError(''); }} placeholder="https://www.youtube.com/watch?v=..." className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#080b12] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-cyan-300/40"/><button type="button" disabled={busy} onClick={start} className="rounded-xl bg-cyan-300 px-4 py-3 text-xs font-black text-slate-950 disabled:opacity-50">{busy ? 'Proses…' : 'Buat Clip'}</button></div>
          {!valid && link && <div className="mt-2 text-[11px] text-rose-300">Link YouTube belum valid.</div>}
          {status && <div className="mt-3 text-xs font-bold text-cyan-200">{status}</div>}
          {error && <div className="mt-3 rounded-xl border border-rose-300/15 bg-rose-300/[0.04] p-3 text-xs leading-5 text-rose-200">{error}</div>}
        </div>
      </div>
      {clips.length > 0 && <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{clips.map((clip, index) => <article key={String(clip.videoId)} className="overflow-hidden rounded-2xl border border-white/10 bg-black/30"><video src={clip.videoUrl} controls preload="metadata" poster={clip.thumbnailUrl} className="aspect-[9/16] w-full bg-black object-contain"/><div className="p-4"><div className="text-sm font-black">{clip.title || `Clip ${index + 1}`}</div><div className="mt-1 text-[11px] text-cyan-300">Viral score: {clip.viralScore ?? '—'}</div>{clip.viralReason && <p className="mt-2 text-xs leading-5 text-slate-500">{clip.viralReason}</p>}<div className="mt-3 flex gap-2"><a href={clip.videoUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-cyan-300 px-3 py-2 text-[11px] font-black text-slate-950">Buka / Simpan</a></div></div></article>)}</div>}
      <p className="mt-4 text-[10px] leading-5 text-slate-600">Gunakan hanya video yang kamu miliki atau punya izin untuk diproses. Link hasil provider bersifat sementara dan dapat kedaluwarsa.</p>
      <div className="mt-1 text-[10px] text-slate-700">Mode: {plan === 'owner' ? 'Owner' : 'User'} • LumiClip AI YouTube provider</div>
    </section>
  );
}
