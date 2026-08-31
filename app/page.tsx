'use client';

import { useState } from 'react';

export default function Home() {
  const [fileName, setFileName] = useState('');

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-black tracking-tight">
              <span className="text-cyan-400">Clipp</span>Now
            </div>
            <p className="text-xs text-slate-400">AI Video Clip Studio</p>
          </div>

          <div className="rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-xs text-slate-300">
            Beta
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center py-16">
          <div className="w-full max-w-4xl text-center">
            <div className="mb-6 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
              ✦ AI-powered video clipping
            </div>

            <h1 className="text-4xl font-black leading-tight sm:text-6xl">
              Ubah video panjang menjadi
              <span className="block text-cyan-400">clip siap posting.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              Upload video kamu, pilih bagian yang ingin dipotong, lalu
              kembangkan ClippNow menjadi studio editing video berbasis AI.
            </p>

            <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-2xl">
              <label
                htmlFor="video"
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-600 px-6 py-12 transition hover:border-cyan-400 hover:bg-slate-800/60"
              >
                <div className="mb-4 text-5xl">🎬</div>
                <div className="text-lg font-bold">
                  {fileName || 'Pilih video untuk mulai'}
                </div>
                <div className="mt-2 text-sm text-slate-400">
                  MP4, MOV, atau WebM
                </div>

                <input
                  id="video"
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(event) =>
                    setFileName(event.target.files?.[0]?.name ?? '')
                  }
                />
              </label>

              <button
                type="button"
                disabled={!fileName}
                className="mt-5 w-full rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {fileName ? 'Lanjutkan →' : 'Upload Video'}
              </button>
            </div>

            <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
              <Feature icon="⚡" title="Cepat" text="Alur sederhana untuk membuat clip." />
              <Feature icon="✂️" title="Potong" text="Siapkan fondasi editor video." />
              <Feature icon="🤖" title="AI Ready" text="Siap dikembangkan dengan fitur AI." />
            </div>
          </div>
        </div>

        <footer className="border-t border-slate-800 pt-5 text-center text-xs text-slate-500">
          ClippNow © 2026 · AI Video Clip Studio
        </footer>
      </section>
    </main>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="text-2xl">{icon}</div>
      <div className="mt-3 font-bold">{title}</div>
      <p className="mt-1 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}
