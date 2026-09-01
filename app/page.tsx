'use client';

import { DragEvent, useRef, useState } from 'react';

export default function Home() {
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file?: File) => {
    if (!file || !file.type.startsWith('video/')) return;
    setFileName(file.name);
    setFileSize(formatSize(file.size));
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] text-white selection:bg-cyan-400 selection:text-slate-950">
      <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 top-40 h-[28rem] w-[28rem] rounded-full bg-violet-500/10 blur-3xl" />

      <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 font-black text-slate-950 shadow-lg shadow-cyan-400/20">
              C
            </div>
            <div>
              <div className="text-xl font-black tracking-tight sm:text-2xl">
                Clipp<span className="text-cyan-400">Now</span>
              </div>
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">AI Video Studio</p>
            </div>
          </div>

          <div className="hidden items-center gap-3 text-sm text-slate-400 sm:flex">
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-cyan-300">✦ Beta</span>
            <span>Fast • Simple • AI Ready</span>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center py-12 sm:py-16">
          <div className="w-full max-w-5xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300 shadow-lg shadow-black/10 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
              AI-powered video clipping
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Turn long videos into
              <span className="block bg-gradient-to-r from-cyan-300 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                clips people want to watch.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-slate-400 sm:text-lg">
              Upload video kamu dan siapkan konten pendek untuk TikTok, Reels, dan Shorts. ClippNow dibuat untuk workflow yang cepat dan simpel.
            </p>

            <div className="mx-auto mt-9 max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.045] p-3 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-4">
              <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`group cursor-pointer rounded-[1.5rem] border-2 border-dashed px-6 py-10 transition-all sm:py-12 ${dragging ? 'border-cyan-300 bg-cyan-400/10 scale-[1.01]' : 'border-white/10 bg-black/10 hover:border-cyan-400/50 hover:bg-cyan-400/[0.04]'}`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,video/*"
                  className="hidden"
                  onChange={(event) => handleFile(event.target.files?.[0])}
                />

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10 text-3xl ring-1 ring-cyan-400/20 transition group-hover:scale-105">
                  🎬
                </div>
                <div className="mt-5 text-lg font-bold sm:text-xl">
                  {fileName || 'Drop your video here'}
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  {fileName ? `${fileSize} • Siap diproses` : 'atau klik untuk memilih file dari laptop'}
                </div>
                {!fileName && (
                  <div className="mt-5 inline-flex rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-400">
                    MP4 • MOV • WebM
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={!fileName}
                className="mt-3 w-full rounded-2xl bg-cyan-400 px-5 py-4 font-bold text-slate-950 shadow-lg shadow-cyan-400/10 transition hover:bg-cyan-300 hover:shadow-cyan-400/20 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500 disabled:shadow-none"
              >
                {fileName ? '✨ Generate Clips' : 'Upload video untuk mulai'}
              </button>
            </div>

            <div className="mx-auto mt-8 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
              <Feature icon="⚡" title="Fast workflow" text="Upload dan mulai dari satu tempat." />
              <Feature icon="✂️" title="Smart clips" text="Fondasi siap untuk pemotongan otomatis." />
              <Feature icon="🤖" title="AI ready" text="Siap dikembangkan ke fitur AI berikutnya." />
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-600">
              <span>✓ No complicated editor</span>
              <span>✓ Built for creators</span>
              <span>✓ Responsive on laptop & mobile</span>
            </div>
          </div>
        </div>

        <footer className="border-t border-white/10 pt-5 text-center text-xs text-slate-600">
          ClippNow © 2026 · AI Video Clip Studio
        </footer>
      </section>
    </main>
  );
}

function Feature({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.06]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-lg">{icon}</div>
        <div>
          <div className="font-bold">{title}</div>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">{text}</p>
        </div>
      </div>
    </div>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
