'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState('');

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

  async function signInWithProvider(provider: 'google' | 'facebook') {
    setSocialLoading(provider);
    setError('');
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    if (oauthError) {
      setError(`Login ${provider === 'google' ? 'Google' : 'Facebook'} belum tersedia. Aktifkan provider di Supabase Auth.`);
      setSocialLoading('');
    }
  }

  function signInWithTikTok() {
    setError('Login TikTok sedang disiapkan sebagai OAuth khusus ClippNow. Untuk keamanan, jangan gunakan tombol ini sebelum provider TikTok diaktifkan di Supabase.');
  }

  return (
    <main className="min-h-screen bg-[#05070d] px-5 py-10 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 shadow-2xl shadow-black/30 sm:p-9">
          <a href="/" className="text-xl font-black">Clipp<span className="text-cyan-300">Now</span></a>
          <div className="mt-10 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Creator access</div>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Masuk ke workspace</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">Pilih cara masuk yang paling cepat. Project dan kredit tetap tersimpan di satu akun ClippNow.</p>

          <div className="mt-7 grid gap-3">
            <button
              type="button"
              disabled={Boolean(socialLoading)}
              onClick={() => signInWithProvider('google')}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-black text-slate-900 transition hover:bg-slate-100 disabled:opacity-50"
            >
              <span className="text-base font-black">G</span>
              {socialLoading === 'google' ? 'Menghubungkan…' : 'Lanjut dengan Google'}
            </button>
            <button
              type="button"
              disabled={Boolean(socialLoading)}
              onClick={() => signInWithProvider('facebook')}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#1877F2]/40 bg-[#1877F2] px-4 py-3 text-sm font-black text-white transition hover:brightness-110 disabled:opacity-50"
            >
              <span className="text-base font-black">f</span>
              {socialLoading === 'facebook' ? 'Menghubungkan…' : 'Lanjut dengan Facebook'}
            </button>
            <button
              type="button"
              disabled={Boolean(socialLoading)}
              onClick={signInWithTikTok}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-black px-4 py-3 text-sm font-black text-white transition hover:bg-black/80 disabled:opacity-50"
            >
              <span className="text-base font-black">♪</span>
              Lanjut dengan TikTok
            </button>
          </div>

          <div className="my-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
            <span className="h-px flex-1 bg-white/10" /> atau dengan email <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block"><span className="mb-2 block text-xs font-bold text-slate-400">Email</span><input required autoComplete="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-cyan-300/60" /></label>
            <label className="block"><span className="mb-2 block text-xs font-bold text-slate-400">Password</span><input required autoComplete="current-password" minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-cyan-300/60" /></label>
            {error && <p className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs font-semibold leading-5 text-rose-300">{error}</p>}
            <button disabled={loading || Boolean(socialLoading)} className="w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-50">{loading ? 'Memproses…' : 'Masuk dengan Email →'}</button>
          </form>
          <p className="mt-6 text-center text-xs text-slate-600">Belum punya akun? <a href="/auth/signup" className="font-bold text-cyan-300">Daftar gratis</a></p>
        </div>
      </div>
    </main>
  );
}
