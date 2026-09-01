'use client';

import type { ChangeEvent, DragEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

type ClipFormat = '9:16' | '1:1' | '16:9';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [format, setFormat] = useState<ClipFormat>('9:16');
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setVideoUrl('');
      return;
    }
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFile = (nextFile?: File) => {
    if (!nextFile || !nextFile.type.startsWith('video/')) return;
    setFile(nextFile);
    setFileName(nextFile.name);
    setFileSize(formatSize(nextFile.size));
    setStatus('');
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const handleLoadedMetadata = (event: ChangeEvent<HTMLVideoElement>) => {
    const nextDuration = Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0;
    setDuration(nextDuration);
    setStart(0);
    setEnd(nextDuration);
  };

  const handleGenerate = () => {
    if (!file || !duration) return;
    setStatus(`Clip siap: ${formatTime(start)} – ${formatTime(end)} • ${format}`);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] text-white selection:bg-cyan-400 selection:text-slate-950">
      <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 top-40 h-[28rem] w-[28rem] rounded-full bg-violet-500/10 blur-3xl" />

      <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 font-black text-slate-950 shadow-lg shadow-cyan-400/20">C</div>
            <div>
              <div className="text-xl font-black tracking-tight sm:text-2xl">Clipp<span className="text-cyan-400">Now</span></div>
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">AI Video Studio</p>
            </div>
          </div>
          <div className="hidden items-center gap-3 text-sm text-slate-400 sm:flex">
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-cyan-300">✦ Beta</span>
            <span>Fast • Simple • AI Ready</span>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center py-10 sm:py-14">
          <div className="w-full max-w-5xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
              AI-powered video clipping
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Turn long videos into
              <span className="block bg-gradient-to-r from-cyan-300 via-cyan-400 to-violet-400 bg-clip-text text-transparent">clips people want to watch.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-slate-400 sm:text-lg">
              Upload video, preview langsung, pilih durasi clip dan format konten sebelum masuk ke tahap AI processing.
            </p>

            {!file ? (
              <div className="mx-auto mt-9 max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.045] p-3 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-4">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => inputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
                  }}
                  onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={`group cursor-pointer rounded-[1.5rem] border-2 border-dashed px-6 py-12 transition-all ${dragging ? 'scale-[1.01] border-cyan-300 bg-cyan-400/10' : 'border-white/10 bg-black/10 hover:border-cyan-400/50 hover:bg-cyan-400/[0.04]'}`}
                >
                  <input ref={inputRef} type="file" accept="video/mp4,video/quicktime,video/webm,video/*" className="hidden" onChange={handleInput} />
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10 text-3xl ring-1 ring-cyan-400/20 transition group-hover:scale-105">🎬</div>
                  <div className="mt-5 text-lg font-bold sm:text-xl">Drop your video here</div>
                  <div className="mt-2 text-sm text-slate-500">atau klik untuk memilih file dari laptop</div>
                  <div className="mt-5 inline-flex rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-400">MP4 • MOV • WebM</div>
                </div>
              </div>
            ) : (
              <div className="mx-auto mt-9 max-w-4xl rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 text-left shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-5">
                <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
                    <video src={videoUrl} controls className="aspect-video h-full w-full object-contain" onLoadedMetadata={handleLoadedMetadata} />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                    <div className="text-sm font-bold text-white">{fileName}</div>
                    <div className="mt-1 text-xs text-slate-500">{fileSize} • {formatTime(duration)}</div>

                    <div className="mt-6">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span>Start</span><span>{formatTime(start)}</span>
                      </div>
                      <input aria-label="Clip start" type="range" min="0" max={Math.max(duration, 0)} step="0.1" value={start} onChange={(event) => setStart(Math.min(Number(event.target.value), end - 0.1))} className="mt-2 w-full accent-cyan-400" />
                    </div>

                    <div className="mt-5">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span>End</span><span>{formatTime(end)}</span>
                      </div>
                      <input aria-label="Clip end" type="range" min="0.1" max={Math.max(duration, 0.1)} step="0.1" value={end} onChange={(event) => setEnd(Math.max(Number(event.target.value), start + 0.1))} className="mt-2 w-full accent-cyan-400" />
                    </div>

                    <div className="mt-6">
                      <div className="mb-2 text-xs font-semibold text-slate-400">Format</div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['9:16', '1:1', '16:9'] as ClipFormat[]).map((item) => (
                          <button key={item} type="button" onClick={() => setFormat(item)} className={`rounded-xl border px-2 py-2 text-xs font-bold transition ${format === item ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300' : 'border-white/10 bg-white/[0.03] text-slate-500 hover:border-white/20'}`}>{item}</button>
                        ))}
                      </div>
                    </div>

                    <button type="button" onClick={handleGenerate} className="mt-6 w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-300">✨ Generate Clip</button>
                    {status && <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300">{status}</div>}
                  </div>
                </div>
              </div>
            )}

            <div className="mx-auto mt-8 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
              <Feature icon="⚡" title="Fast workflow" text="Upload dan preview langsung." />
              <Feature icon="✂️" title="Smart trim" text="Atur start dan end clip." />
              <Feature icon="🤖" title="AI ready" text="Fondasi siap untuk AI processing." />
            </div>
          </div>
        </div>

        <footer className="border-t border-white/10 pt-5 text-center text-xs text-slate-600">ClippNow © 2026 · AI Video Clip Studio</footer>
      </section>
    </main>
  );
}

function Feature({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.06]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-lg">{icon}</div>
        <div><div className="font-bold">{title}</div><p className="mt-0.5 text-xs leading-5 text-slate-500">{text}</p></div>
      </div>
    </div>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
