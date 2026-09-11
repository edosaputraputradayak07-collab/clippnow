'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getLoginErrorMessage } from '@/lib/auth/login-message';
import { getSocialProviderError, getSocialProviderLabel, type SocialProvider } from '@/lib/auth/social-providers';
import { authExperience } from '@/lib/ui/marketing-experience';
import { getPasswordInputType } from '@/lib/ui/password-visibility';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | ''>('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(getLoginErrorMessage(signInError));
      setLoading(false);
      return;
    }

    window.location.href = '/dashboard';
  }

  async function signInWithProvider(provider: SocialProvider) {
    setSocialLoading(provider);
    setError('');

    const supabase = createClient();
    const oauthProvider = (provider === 'tiktok' ? 'custom:tiktok' : provider) as Parameters<
      typeof supabase.auth.signInWithOAuth
    >[0]['provider'];

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: oauthProvider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    if (oauthError) {
      setError(getSocialProviderError(provider));
      setSocialLoading('');
    }
  }

  return (
    <main className="min-h-screen bg-[#05070d] text-white lg:grid lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden border-r border-white/10 p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-cyan-300/10 blur-[100px]" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-80 w-80 rounded-full bg-violet-400/10 blur-[100px]" />
        <a href="/" className="relative flex items-center gap-3 text-xl font-black">
          <BrandMark />
          <span>Vid<span className="text-cyan-300">klipral</span></span>
        </a>
        <div className="relative max-w-xl">
          <div className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">{authExperience.visualLabel}</div>
          <h2 className="mt-5 text-5xl font-black leading-none tracking-[-.04em]">
            Video panjang masuk.<span className="block text-slate-500">Momen viral keluar.</span>
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-6 text-slate-500">
            Masuk untuk melanjutkan workspace, menyimpan project, kredit, dan hasil render kamu.
          </p>
          <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[.03] p-3">
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
              <div className="aspect-video bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,.25),transparent_28%),radial-gradient(circle_at_75%_65%,rgba(139,92,246,.2),transparent_32%),linear-gradient(135deg,#101827,#05070d)] p-5">
                <div className="flex h-full items-end justify-between rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div>
                    <div className="text-[8px] font-black uppercase tracking-widest text-cyan-200">AI Viral Engine</div>
                    <div className="mt-2 text-xl font-black">Detect → Caption → Enhance</div>
                    <div className="mt-3 text-[9px] font-bold text-slate-500">One tap workflow for creators</div>
                  </div>
                  <div className="h-16 w-1 rounded-full bg-cyan-300 shadow-[0_0_24px_rgba(103,232,249,.7)]" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-white/10 p-3">
                <div className="rounded-lg bg-cyan-300/10 p-2 text-[8px] font-black text-cyan-200">HOOK +92%</div>
                <div className="rounded-lg bg-white/5 p-2 text-[8px] font-black text-slate-400">SUBTITLE AI</div>
                <div className="rounded-lg bg-white/5 p-2 text-[8px] font-black text-slate-400">9:16 READY</div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative text-[10px] font-bold text-slate-600">Private projects • Fast workflow • Creator-first</div>
      </section>

      <div className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 shadow-2xl shadow-black/30 sm:p-9">
          <a href="/" className="text-xl font-black lg:hidden">Vid<span className="text-cyan-300">klipral</span></a>
          <div className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Creator access</div>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Masuk ke workspace</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">Lanjutkan membuat clip dengan AI.</p>

          <div className="mt-7 grid gap-3">
            <SocialButton provider="google" loading={socialLoading === 'google'} disabled={Boolean(socialLoading)} onClick={signInWithProvider} />
            <SocialButton provider="facebook" loading={socialLoading === 'facebook'} disabled={Boolean(socialLoading)} onClick={signInWithProvider} />
            <SocialButton provider="tiktok" loading={socialLoading === 'tiktok'} disabled={Boolean(socialLoading)} onClick={signInWithProvider} />
          </div>

          <div className="my-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
            <span className="h-px flex-1 bg-white/10" /> atau email <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-400">Email</span>
              <input required autoComplete="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-cyan-300/60" />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-400">Password</span>
              <div className="relative">
                <input required autoComplete="current-password" minLength={8} type={getPasswordInputType(passwordVisible)} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 pr-12 text-sm outline-none focus:border-cyan-300/60" />
                <button type="button" onClick={() => setPasswordVisible((visible) => !visible)} aria-label={passwordVisible ? 'Sembunyikan password' : 'Tampilkan password'} title={passwordVisible ? 'Sembunyikan password' : 'Tampilkan password'} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-lg text-slate-500 transition hover:text-cyan-300">{passwordVisible ? '🙈' : '👁️'}</button>
              </div>
            </label>
            <div className="-mt-1 text-right"><a href="/auth/forgot-password" className="text-xs font-bold text-cyan-300 hover:text-cyan-200">Lupa password?</a></div>
            {error && <p className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs font-semibold leading-5 text-rose-300">{error}</p>}
            <button disabled={loading || Boolean(socialLoading)} className="w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-50">{loading ? 'Memproses…' : 'Masuk dengan Email →'}</button>
          </form>
          <p className="mt-6 text-center text-xs text-slate-600">Belum punya akun? <a href="/auth/signup" className="font-bold text-cyan-300">Daftar gratis</a></p>
        </div>
      </div>
    </main>
  );
}

function SocialButton({ provider, loading, disabled, onClick }: { provider: SocialProvider; loading: boolean; disabled: boolean; onClick: (provider: SocialProvider) => void }) {
  const label = `Lanjut dengan ${getSocialProviderLabel(provider)}`;
  const style = provider === 'google'
    ? 'border-white/10 bg-white text-slate-900 hover:bg-slate-100'
    : provider === 'facebook'
      ? 'border-[#1877F2]/40 bg-[#1877F2] text-white hover:brightness-110'
      : 'border-white/10 bg-black text-white hover:bg-black/80';

  return (
    <button type="button" disabled={disabled} onClick={() => onClick(provider)} aria-label={label} className={`flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-black transition disabled:opacity-50 ${style}`}>
      <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center">
        {provider === 'google' && <GoogleIcon />}
        {provider === 'facebook' && <FacebookIcon />}
        {provider === 'tiktok' && <TikTokIcon />}
      </span>
      {loading ? 'Menghubungkan…' : label}
    </button>
  );
}

function GoogleIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true"><path fill="#4285F4" d="M21.35 12.27c0-.74-.07-1.45-.2-2.13H12v4.03h5.22a4.47 4.47 0 0 1-1.94 2.93v2.43h3.14c1.84-1.7 2.93-4.2 2.93-7.26Z"/><path fill="#34A853" d="M12 21.76c2.64 0 4.86-.87 6.48-2.36l-3.14-2.43c-.87.58-1.98.92-3.34.92-2.56 0-4.73-1.73-5.51-4.06H3.24v2.5A9.8 9.8 0 0 0 12 21.76Z"/><path fill="#FBBC05" d="M6.49 13.83A5.89 5.89 0 0 1 6.18 12c0-.64.11-1.26.31-1.83v-2.5H3.24A9.78 9.78 0 0 0 2.2 12c0 1.58.38 3.08 1.04 4.33l3.25-2.5Z"/><path fill="#EA4335" d="M12 6.11c1.44 0 2.73.5 3.75 1.48l2.81-2.81C16.85 3.16 14.64 2.24 12 2.24a9.8 9.8 0 0 0-8.76 5.43l3.25 2.5C7.27 7.84 9.44 6.11 12 6.11Z"/></svg>;
}

function FacebookIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.25-1.5 1.55-1.5h1.65V3.62c-.29-.04-1.29-.12-2.46-.12-2.44 0-4.11 1.49-4.11 4.23v2.17H7.4V13h2.73v8h3.37Z"/></svg>;
}

function TikTokIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true"><path fill="#25F4EE" d="M15.7 3.2c.5 2.9 2.2 4.6 5.1 4.8v3.2a8.9 8.9 0 0 1-5.1-1.6v5.6a5.8 5.8 0 1 1-5-5.8v3.3a2.5 2.5 0 1 0 1.8 2.4V3.2h3.2Z"/><path fill="#FE2C55" d="M14.2 4.3c.6 2.5 2.2 4 4.8 4.4v1.5a8.8 8.8 0 0 1-3.3-.9v5.7a5.8 5.8 0 0 1-6.5 5.8 5.7 5.7 0 0 0 4.8-5.6V9.6c.6.3 1.2.5 1.9.6V4.3h-1.7Z"/><path fill="white" d="M13.5 3.2h2.2c.5 2.8 2.2 4.5 5.1 4.8v1.7c-3-.2-5.1-1.5-6.1-3.7v9.2a4.1 4.1 0 1 1-3.6-4.1v1.8a2.3 2.3 0 1 0 1.4 2.1V3.2h1Z"/></svg>;
}

function BrandMark() {
  return <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/30"><span className="absolute h-6 w-6 rounded-full border-[5px] border-slate-950" /><span className="absolute right-1.5 h-2.5 w-2.5 rotate-45 rounded-[2px] bg-cyan-300" /><span className="relative text-[9px] font-black">▶</span></span>;
}
