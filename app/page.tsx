"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");

  return (
    <main className="min-h-screen bg-[#0f172a] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            Clip<span className="text-cyan-400">Now</span>
          </h1>

          <button className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold hover:bg-cyan-400">
            Upload Video
          </button>
        </header>

        <section className="py-24 text-center">
          <p className="mb-4 text-cyan-400 font-semibold">
            AI VIDEO CLIP STUDIO
          </p>

          <h2 className="text-5xl font-bold leading-tight">
            Ubah video panjang menjadi
            <br />
            konten pendek dalam hitungan menit.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-slate-400">
            Upload video atau masukkan link. ClippNow akan membantu
            menemukan bagian terbaik untuk Shorts, Reels, dan TikTok.
          </p>

          <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-3">
            <div className="flex gap-3">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Tempel link video di sini..."
                className="flex-1 rounded-xl bg-slate-800 px-5 py-4 outline-none"
              />

              <button className="rounded-xl bg-cyan-500 px-6 font-bold text-slate-950">
                Generate
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {[
            ["01", "Upload Video", "Masukkan video yang ingin diproses."],
            ["02", "AI Mencari Momen", "Temukan bagian video yang paling menarik."],
            ["03", "Generate Clips", "Siapkan clip untuk Shorts, Reels, dan TikTok."],
          ].map(([number, title, description]) => (
            <div
              key={number}
              className="rounded-2xl border border-slate-700 bg-slate-900 p-6"
            >
              <div className="mb-5 text-cyan-400 text-sm font-bold">
                {number}
              </div>

              <h3 className="text-xl font-bold">{title}</h3>

              <p className="mt-2 text-slate-400">{description}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
