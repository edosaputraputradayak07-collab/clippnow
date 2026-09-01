'use client';

import type { ChangeEvent, DragEvent, SyntheticEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

type ClipFormat = '9:16' | '1:1' | '16:9';

export default function CreateStudio({ initialCredits, plan }: { initialCredits: number; plan: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [format, setFormat] = useState<ClipFormat>('9:16');
  const [credits, setCredits] = useState(initialCredits);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) return setUrl('');
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  function selectFile(next?: File) {
    if (!next) return;
    if (!next.type.startsWith('video/')) return setError('Pilih file video MP4, MOV, WebM, atau MKV.');
    if (next.size > 500 * 1024 * 1024) return setError('Ukuran video maksimal 500 MB.');
    setError(''); setStatus(''); setFile(next); setDuration(0); setStart(0); setEnd(0);
  }

  function metadata(event: SyntheticEvent<HTMLVideoElement>) {
    const value = Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0;
    setDuration(value); setStart(0); setEnd(value);
  }

  async function prepareClip() {
    if (!file || !duration) return;
    setError(''); setStatus('');
    const response = await fetch('/api/projects', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: file.name.replace(/\.[^.]+$/, ''), original_filename: file.name, start_seconds: start, end_seconds: end, format }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.error ?? 'Project gagal dibuat.'); return; }
    setCredits(data.credits_remaining);
    setStatus(`Project ${data.project_id.slice(0, 8)} siap diantrikan. 1 kredit digunakan.`);
  }

  const minClip = Math.min(0.1, duration || 0.1);
  const startMax = Math.max(0, end - minClip);
  const endMin = Math.min(duration, start + minClip);
  const clipLength = Math.max(0, end - start);

  return (
    <main className="min-h-screen bg-[#05070d] px-4 py-5 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div><a href="/dashboard" className="text-xl font-black">Clipp<span className="text-cyan-300">Now</span></a><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-600">Creator studio</p></div>
          <div className="flex items-center gap-3"><span className="hidden rounded-full border border-white/10 px-3 py-2 text-[10px] font-bold text-slate-500 sm:inline">{plan.toUpperCase()}</span><span className="rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-2 text-xs font-black text-cyan-200">{credits} credits</span></div>
        </header>

        <div className="grid gap-5 py-8 lg:grid-cols-[1.35fr_0.65fr]">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-4 sm:p-5">
            <div className="mb-5 flex items-end justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">01 / Source</div><h1 className="mt-2 text-2xl font-black sm:text-3xl">Pilih video yang mau dipotong.</h1></div><a href="/dashboard" className="text-xs font-bold text-slate-600 hover:text-white">← Dashboard</a></div>
            {!file ? <div role="button" tabIndex={0} onClick={() => inputRef.current?.click()} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(false); selectFile(e.dataTransfer.files?.[0]); }} className={`flex min-h-[420px] cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed p-8 text-center transition ${dragging ? 'border-cyan-300 bg-cyan-300/10' : 'border-white/10 bg-black/10 hover:border-cyan-300/40'}`}><input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>) => selectFile(e.target.files?.[0])} /><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-300 text-2xl text-slate-950">▶</div><h2 className="mt-6 text-lg font-black">Drop video di sini</h2><p className="mt-2 text-sm text-slate-600">atau klik untuk memilih dari perangkat</p><span className="mt-5 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold text-slate-500">MAX 500 MB • MP4 / MOV / WEBM / MKV</span></div> : <div><div className="overflow-hidden rounded-2xl border border-white/10 bg-black"><video src={url} controls onLoadedMetadata={metadata} className="aspect-video w-full object-contain" /></div><div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3"><div className="min-w-0"><div className="truncate text-sm font-bold">{file.name}</div><div className="mt-1 text-xs text-slate-600">{formatSize(file.size)} • {formatTime(duration)}</div></div><button type="button" onClick={() => { setFile(null); setError(''); }} className="shrink-0 text-xs font-bold text-slate-500 hover:text-white">Ganti video</button></div></div>}
          </section>

          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">02 / Clip setup</div>
            <h2 className="mt-2 text-2xl font-black">Atur momen.</h2>
            <p className="mt-2 text-xs leading-5 text-slate-600">Pilih range yang ingin diproses. Engine AI akan mengambil alih pada tahap processing.</p>
            <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex justify-between text-xs font-bold text-slate-500"><span>Start</span><span>{formatTime(start)}</span></div><input disabled={!duration} aria-label="Clip start" type="range" min="0" max={startMax} step="0.1" value={Math.min(start, startMax)} onChange={(e) => setStart(Math.min(Number(e.target.value), Math.max(0, end - minClip)))} className="mt-3 w-full accent-cyan-300" /><div className="mt-5 flex justify-between text-xs font-bold text-slate-500"><span>End</span><span>{formatTime(end)}</span></div><input disabled={!duration} aria-label="Clip end" type="range" min={endMin || 0.1} max={Math.max(duration, 0.1)} step="0.1" value={duration ? Math.max(end, endMin) : 0.1} onChange={(e) => setEnd(Math.max(Number(e.target.value), start + minClip))} className="mt-3 w-full accent-cyan-300" /></div>
            <div className="mt-5 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.04] p-4"><div className="text-[9px] font-black uppercase tracking-widest text-slate-600">Clip duration</div><div className="mt-1 text-2xl font-black text-cyan-200">{formatTime(clipLength)}</div></div>
            <div className="mt-5"><div className="mb-2 text-xs font-bold text-slate-500">Output format</div><div className="grid grid-cols-3 gap-2">{(['9:16','1:1','16:9'] as ClipFormat[]).map((item) => <button key={item} type="button" onClick={() => setFormat(item)} className={`rounded-xl border px-2 py-3 text-xs font-black ${format === item ? 'border-cyan-300 bg-cyan-300/10 text-cyan-200' : 'border-white/10 text-slate-600 hover:text-white'}`}><span className={`mx-auto mb-2 block border border-current ${item === '9:16' ? 'h-7 w-4' : item === '1:1' ? 'h-6 w-6' : 'h-4 w-7'}`} />{item}</button>)}</div></div>
            {error && <div className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs font-semibold text-rose-300">{error}</div>}
            {status && <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs font-semibold text-emerald-300">{status}</div>}
            <button type="button" disabled={!file || !duration || credits < 1} onClick={prepareClip} className="mt-6 w-full rounded-xl bg-cyan-300 px-4 py-3.5 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40">{credits < 1 ? 'Beli kredit untuk lanjut' : 'Siapkan clip →'}</button>
            <p className="mt-3 text-center text-[10px] leading-4 text-slate-700">1 kredit digunakan saat project masuk antrean processing.</p>
          </aside>
        </div>
      </div>
    </main>
  );
}

function formatSize(bytes: number) { return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }
function formatTime(seconds: number) { if (!Number.isFinite(seconds) || seconds <= 0) return '00:00'; const m = Math.floor(seconds / 60); const s = Math.floor(seconds % 60); return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }
