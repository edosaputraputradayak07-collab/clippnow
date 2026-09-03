'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(''); setMessage('');
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/forgot-password`,
    });
    setLoading(false);
    if (resetError) { setError('Kode reset belum bisa dikirim. Coba lagi beberapa saat.'); return; }
    setStep('otp');
    setMessage('Kode OTP 6 digit sudah dikirim ke email kamu.');
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(''); setMessage('');
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({ email: email.trim(), token: otp.trim(), type: 'recovery' });
    setLoading(false);
    if (verifyError) { setError('OTP salah atau sudah kedaluwarsa. Minta kode baru.'); return; }
    setStep('password');
    setMessage('OTP benar. Sekarang buat password baru.');
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage('');
    if (password.length < 8) { setError('Password minimal 8 karakter.'); return; }
    if (password !== confirmPassword) { setError('Konfirmasi password tidak sama.'); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) { setError('Password belum berhasil diubah. Coba ulangi.'); return; }
    setMessage('Password berhasil diubah. Silakan masuk dengan password baru.');
    setTimeout(() => { window.location.href = '/auth/login'; }, 900);
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#05070d] px-5 py-8 text-white sm:px-8">
    <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[.035] p-7 shadow-2xl sm:p-9">
      <a href="/" className="text-xl font-black">Clipp<span className="text-cyan-300">Now</span></a>
      <div className="mt-8 text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">Account recovery</div>
      <h1 className="mt-3 text-3xl font-black tracking-tight">Lupa password?</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">Pulihkan akun dengan kode OTP yang dikirim ke email kamu.</p>
      {step === 'email' && <form onSubmit={sendCode} className="mt-8 space-y-4"><label className="block"><span className="mb-2 block text-xs font-bold text-slate-400">Email akun</span><input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-cyan-300/60" /></label><button disabled={loading} className="w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50">{loading ? 'Mengirim kode…' : 'Kirim kode OTP →'}</button></form>}
      {step === 'otp' && <form onSubmit={verifyCode} className="mt-8 space-y-4"><div className="rounded-xl border border-cyan-300/10 bg-cyan-300/5 px-4 py-3 text-xs text-slate-400">Kode dikirim ke <b className="text-white">{email}</b></div><label className="block"><span className="mb-2 block text-xs font-bold text-slate-400">Kode OTP</span><input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-center text-2xl font-black tracking-[.5em] outline-none focus:border-cyan-300/60" /></label><button disabled={loading || otp.length !== 6} className="w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50">{loading ? 'Memeriksa…' : 'Verifikasi OTP →'}</button><button type="button" onClick={() => { setStep('email'); setOtp(''); setMessage(''); setError(''); }} className="w-full py-2 text-xs font-bold text-slate-500 hover:text-white">Kirim ulang / ganti email</button></form>}
      {step === 'password' && <form onSubmit={changePassword} className="mt-8 space-y-4"><label className="block"><span className="mb-2 block text-xs font-bold text-slate-400">Password baru</span><input required minLength={8} autoComplete="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-cyan-300/60" /></label><label className="block"><span className="mb-2 block text-xs font-bold text-slate-400">Ulangi password baru</span><input required minLength={8} autoComplete="new-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-cyan-300/60" /></label><button disabled={loading} className="w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50">{loading ? 'Menyimpan…' : 'Simpan password baru →'}</button></form>}
      {error && <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs font-semibold leading-5 text-rose-300">{error}</p>}
      {message && <p className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold leading-5 text-emerald-300">{message}</p>}
      <p className="mt-6 text-center text-xs text-slate-600"><a href="/auth/login" className="font-bold text-cyan-300">← Kembali ke login</a></p>
    </div>
  </main>;
}
