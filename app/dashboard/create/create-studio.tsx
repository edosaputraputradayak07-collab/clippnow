'use client';
import type { ChangeEvent, SyntheticEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCreditBalance } from '@/lib/billing/credit-display';
import { getYouTubeEmbedUrl, isYouTubeUrl } from '@/lib/youtube-url';

type ClipFormat = '9:16' | '1:1' | '16:9';
type SourceMode = 'upload' | 'youtube';

export default function CreateStudio({ initialCredits, plan }: { initialCredits: number; plan: string }) {
  const [sourceMode, setSourceMode] = useState<SourceMode>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [duration, setDuration] = useState(0);
  const [format, setFormat] = useState<ClipFormat>('9:16');
  const [credits, setCredits] = useState(initialCredits);
  const [batchCount, setBatchCount] = useState(5);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isOwner = plan === 'owner';
  const youtubeEmbedUrl = getYouTubeEmbedUrl(youtubeLink);
  const youtubeValid = isYouTubeUrl(youtubeLink);

  useEffect(() => { if (!file) { setUrl(''); return; } const objectUrl = URL.createObjectURL(file); setUrl(objectUrl); return () => URL.revokeObjectURL(objectUrl); }, [file]);
  function selectFile(selected?: File) { if (!selected) return; if (!selected.type.startsWith('video/')) return setError('Pilih file video.'); if (selected.size > 500 * 1024 * 1024) return setError('Ukuran video maksimal 500 MB.'); setError(''); setStatus(''); setFile(selected); setDuration(0); }
  function selectMode(mode: SourceMode) { setSourceMode(mode); setError(''); setStatus(''); if (mode === 'youtube') { setFile(null); setDuration(0); } else setYoutubeLink(''); }
  function metadata(e: SyntheticEvent<HTMLVideoElement>) { const value = Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0; setDuration(value); }

  async function prepare() {
    if (!file || !duration || (!isOwner && credits < batchCount) || busy) return;
    setBusy(true); setError(''); setStatus(`Mengunggah video untuk membuat ${batchCount} clip viral…`);
    try {
      const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error('Sesi login berakhir. Silakan login kembali.');
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_'); const sourcePath = `${user.id}/${crypto.randomUUID()}-${safe}`;
      const upload = await supabase.storage.from('clippnow-videos').upload(sourcePath, file, { contentType: file.type, upsert: false });
      if (upload.error) throw new Error(`Upload gagal: ${upload.error.message}`);
      const response = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: file.name.replace(/\.[^.]+$/, ''), original_filename: file.name, source_path: sourcePath, start_seconds: 0, end_seconds: duration, format }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { await supabase.storage.from('clippnow-videos').remove([sourcePath]); throw new Error(data.error ?? 'Project gagal dibuat.'); }
      if (typeof data.credits_remaining === 'number') setCredits(data.credits_remaining);
      setStatus(`AI sedang mencari ${batchCount} momen paling viral…`);
      const aiResponse = await fetch(`/api/projects/${data.project_id}/ai`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal: 'tiktok', language: 'id', count: batchCount }) });
      const aiData = await aiResponse.json().catch(() => ({}));
      if (!aiResponse.ok) throw new Error(aiData.error ?? 'Analisis AI gagal.');
      const ids = Array.isArray(aiData.project_ids) ? aiData.project_ids.filter((id: unknown): id is string => typeof id === 'string') : [data.project_id];
      setStatus(`${ids.length} clip ditemukan. Membuka hasil…`);
      window.location.assign(`/dashboard/projects/${data.project_id}?batch=${encodeURIComponent(ids.join(','))}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Terjadi kesalahan. Coba lagi.'); setBusy(false); }
  }

  return (
    <main className="min-h-screen bg-[#05070d] px-4 py-5 text-white sm:px-8"><div className="mx-auto max-w-7xl">
      <header className="flex items-center justify-between border-b border-white/10 pb-5"><div><a href="/dashboard" className="text-xl font-black">Clipp<span className="text-cyan-300">Now</span></a><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-600">AI Viral Creator Studio</p></div><div className="flex gap-2"><span className="hidden rounded-full border border-white/10 px-3 py-2 text-[10px] font-bold text-slate-500 sm:inline">{plan.toUpperCase()}</span><span className="rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06] px-3 py-2 text-xs font-black text-cyan-200">{formatCreditBalance(credits, plan)} credits</span></div></header>
      <div className="grid gap-5 py-8 lg:grid-cols-[1.35fr_.65fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-4 sm:p-5"><div className="mb-5"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">01 / Source</div><h1 className="mt-2 text-2xl font-black sm:text-3xl">Upload video. Biar AI yang cari momennya.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Upload file langsung, atau tempel link YouTube untuk melihat sumbernya sebelum kamu memasukkan video yang berhak kamu gunakan.</p></div>
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/20 p-1"><button onClick={() => selectMode('upload')} className={`rounded-xl px-4 py-3 text-xs font-black transition ${sourceMode === 'upload' ? 'bg-cyan-300 text-slate-950' : 'text-slate-500 hover:text-white'}`}>📁 Upload Video</button><button onClick={() => selectMode('youtube')} className={`rounded-xl px-4 py-3 text-xs font-black transition ${sourceMode === 'youtube' ? 'bg-cyan-300 text-slate-950' : 'text-slate-500 hover:text-white'}`}>🔗 Paste YouTube</button></div>
          {sourceMode === 'upload' ? (!file ? <div onClick={() => inputRef.current?.click()} className="flex min-h-[420px] cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-white/10 bg-black/10 p-8 text-center hover:border-cyan-300/40"><input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(e: ChangeEvent<HTMLInputElement>) => selectFile(e.target.files?.[0])}/><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-300 text-2xl text-slate-950">▶</div><h2 className="mt-6 text-lg font-black">Klik untuk memilih video</h2><p className="mt-2 text-sm text-slate-600">MP4, MOV, WebM, MKV • maksimal 500 MB</p></div> : <><video src={url} controls onLoadedMetadata={metadata} className="aspect-video w-full rounded-2xl bg-black object-contain"/><div className="mt-4 flex items-center justify-between"><div><div className="text-sm font-bold">{file.name}</div><div className="text-xs text-slate-600">{formatSize(file.size)} • {formatTime(duration)}</div></div><button onClick={() => {setFile(null);setDuration(0);setStatus('');}} className="text-xs font-bold text-slate-500">Ganti</button></div></>) : <div className="space-y-4"><div className="rounded-2xl border border-white/10 bg-black/20 p-4"><label className="text-xs font-bold text-slate-400">Link YouTube</label><div className="mt-2 flex gap-2"><input value={youtubeLink} onChange={(e)=>{setYoutubeLink(e.target.value);setError('')}} placeholder="https://www.youtube.com/watch?v=..." className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#080b12] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-cyan-300/40"/><button onClick={()=>{if(!youtubeValid)setError('Link YouTube tidak valid. Gunakan link youtube.com atau youtu.be.')}} className="rounded-xl bg-cyan-300 px-4 py-3 text-xs font-black text-slate-950">Preview</button></div>{youtubeLink&&!youtubeValid&&<p className="mt-2 text-[11px] text-rose-300">Link belum dikenali sebagai URL YouTube.</p>}</div>{youtubeEmbedUrl?<div className="overflow-hidden rounded-2xl border border-white/10 bg-black"><div className="aspect-video"><iframe title="YouTube preview" src={youtubeEmbedUrl} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/></div><button type="button" onClick={()=>{setSourceMode('upload');setError('');setStatus('Silakan pilih file video sumber untuk diproses AI.');setTimeout(()=>inputRef.current?.click(),0);}} className="m-3 w-[calc(100%-1.5rem)] rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950">📤 Upload video ini untuk diproses AI →</button></div>:<div className="flex min-h-[350px] items-center justify-center rounded-[1.5rem] border-2 border-dashed border-white/10 bg-black/10 p-8 text-center"><div><div className="text-4xl">🔗</div><h2 className="mt-4 text-lg font-black">Tempel link YouTube</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-600">Video akan tampil sebagai preview. Untuk proses AI dan render MP4, masukkan file video yang kamu miliki atau punya izin untuk digunakan.</p></div></div>}{youtubeEmbedUrl&&<div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.05] p-3 text-xs leading-5 text-amber-200/80">Preview YouTube aktif. Vidklipral tidak mengunduh atau mengambil ulang video YouTube secara otomatis. Upload sumber videonya untuk mulai proses AI.</div>}</div>}
        </section>
        <aside className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">02 / AI Viral Engine</div><h2 className="mt-2 text-2xl font-black">Bikin banyak clip sekaligus.</h2><p className="mt-2 text-sm leading-6 text-slate-500">AI memilih beberapa momen berbeda dari satu video, lalu masing-masing dibuat menjadi video pendek.</p>
          <div className="mt-6 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4"><div className="text-xs font-black text-white">Jumlah hasil</div><div className="mt-3 grid grid-cols-3 gap-2">{[5,8,10].map(value=><button key={value} onClick={()=>setBatchCount(value)} className={`rounded-xl border px-3 py-3 text-sm font-black ${batchCount===value?'border-cyan-300 bg-cyan-300/10 text-cyan-200':'border-white/10 text-slate-500'}`}>{value} video</button>)}</div><p className="mt-2 text-[10px] text-slate-600">{isOwner?'Owner: batch tidak mengurangi kredit.':`${batchCount} video = ${batchCount} kredit.`}</p></div>
          <div className="mt-5 space-y-3">{[['01','Transcribe','AI membaca ucapan dan timing.'],['02','Find viral moments',`AI memilih ${batchCount} bagian paling kuat.`],['03','Edit','Subtitle + motion + punch effect.'],['04','Render','Setiap momen jadi MP4 terpisah.']].map(([number,title,description])=><div key={number} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-center gap-3"><span className="text-[9px] font-black text-cyan-300">{number}</span><span className="text-sm font-black">{title}</span></div><p className="mt-1 pl-7 text-xs leading-5 text-slate-600">{description}</p></div>)}</div>
          <div className="mt-5"><div className="mb-2 text-xs font-bold text-slate-500">Format output</div><div className="grid grid-cols-3 gap-2">{(['9:16','1:1','16:9'] as ClipFormat[]).map(value=><button key={value} onClick={()=>setFormat(value)} className={`rounded-xl border px-2 py-3 text-xs font-black ${format===value?'border-cyan-300 bg-cyan-300/10 text-cyan-200':'border-white/10 text-slate-600'}`}>{value}</button>)}</div></div>
          {error&&<div className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-300">{error}</div>}{status&&<div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-300">{status}</div>}
          <button disabled={sourceMode!=='upload'||!file||!duration||(!isOwner&&credits<batchCount)||busy} onClick={prepare} className="mt-6 w-full rounded-xl bg-cyan-300 px-4 py-3.5 text-sm font-black text-slate-950 disabled:opacity-40">{busy?'AI memilih banyak momen…':sourceMode==='youtube'?'Upload sumber untuk mulai →':!isOwner&&credits<batchCount?'Kredit tidak cukup':'Buat video viral →'}</button><p className="mt-3 text-center text-[10px] leading-4 text-slate-700">{isOwner?'Owner: proses batch tidak mengurangi kredit.':`Setiap clip memakai 1 credit.`}</p>
        </aside>
      </div>
    </div></main>
  );
}
function formatSize(bytes:number){return `${(bytes/1024/1024).toFixed(1)} MB`;} function formatTime(seconds:number){if(!Number.isFinite(seconds)||seconds<=0)return '00:00';return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;}
