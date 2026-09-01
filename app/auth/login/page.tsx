'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError('Email atau password tidak benar.');
      setLoading(false);
      return;
    }
    window.location.href = '/dashboard';
  }

  return (
    <main className="min-h-screen bg-[#05070d] px-5 py-10 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 shadow-2xl shadow-black/30 sm:p-9">
          <a href="/" className="text-xl font-black">Clipp<span className="text-cyan-300">Now</span></a>
          <div className="mt-10 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Creator access</div>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Masuk ke workspace</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">Kelola kredit, project, dan proses clip kamu dari satu tempat.</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block"><span className="mb-2 block text-xs font-bold text-slate-400">Email</span><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-cyan-300/60" /></label>
            <label className="block"><span className="mb-2 block text-xs font-bold text-slate-400">Password</span><input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-cyan-300/60" /></label>
            {error && <p className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-300">{error}</p>}
            <button disabled={loading} className="w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-50">{loading ? 'Memproses…' : 'Masuk →'}</button>
          </form>
          <p className="mt-6 text-center text-xs text-slate-600">Belum punya akun? <a href="/auth/signup" className="font-bold text-cyan-300">Daftar gratis</a></p>
        </div>
      </div>
    </main>
  );
}
