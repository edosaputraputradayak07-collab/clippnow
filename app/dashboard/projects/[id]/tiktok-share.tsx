'use client';
import { useEffect, useRef, useState } from 'react';

export default function TikTokShare({ projectId }: { projectId: string }) {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<{ display_name?: string | null } | null>(null);
  const [creator, setCreator] = useState<{ privacy_level_options?: string[] } | null>(null);
  const [caption, setCaption] = useState('');
  const [privacy, setPrivacy] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [publishId, setPublishId] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (pollTimer.current) clearTimeout(pollTimer.current); }, []);

  async function load() {
    const r = await fetch('/api/tiktok/account', { cache: 'no-store' });
    const d = await r.json().catch(() => ({}));
    setConnected(Boolean(d.connected));
    setAccount(d.account ?? null);
    if (d.connected) {
      const c = await fetch('/api/tiktok/creator-info', { cache: 'no-store' });
      const cd = await c.json().catch(() => ({}));
      if (c.ok) { setCreator(cd.creator ?? null); setPrivacy(cd.creator?.privacy_level_options?.[0] ?? ''); }
    }
  }
  useEffect(() => { void load(); }, []);

  function pollStatus(id: string, attempts = 0) {
    if (attempts >= 20) return;
    pollTimer.current = setTimeout(async () => {
      const r = await fetch('/api/tiktok/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ publish_id: id }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setMessage(d.error ?? 'Status TikTok tidak dapat dibaca.'); return; }
      if (d.status === 'PUBLISH_COMPLETE') { setMessage('✅ Video berhasil dipublikasikan ke TikTok.'); setPublishId(null); return; }
      if (d.status === 'FAILED') { setMessage(`❌ TikTok gagal memproses video${d.fail_reason ? `: ${d.fail_reason}` : '.'}`); setPublishId(null); return; }
      setMessage('Video sedang diproses TikTok…'); pollStatus(id, attempts + 1);
    }, 3000);
  }

  async function post(mode: 'direct' | 'draft') {
    if (!consent) return;
    setBusy(true); setMessage('');
    try {
      const r = await fetch('/api/tiktok/post', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project_id: projectId, mode, caption, privacy_level: privacy, consent }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setMessage(d.error ?? 'Gagal mengirim ke TikTok.'); return; }
      setPublishId(d.publish_id ?? null);
      setMessage(mode === 'direct' ? 'Video dikirim ke TikTok. Memantau status publikasi…' : 'Video dikirim sebagai Draft. Lanjutkan dari inbox TikTok.');
      if (mode === 'direct' && d.publish_id) pollStatus(d.publish_id);
    } catch { setMessage('Tidak dapat terhubung ke TikTok.'); }
    finally { setBusy(false); }
  }

  return <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-300">Publish Studio</div><h2 className="mt-1 text-xl font-black">TikTok</h2><p className="mt-1 text-sm text-slate-500">Kamu yang memilih kapan video dikirim. ClippNow tidak publish otomatis.</p></div>{connected ? <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-200">Terhubung{account?.display_name ? ` • ${account.display_name}` : ''}</span> : <a href="/api/tiktok/connect" className="rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950">Hubungkan TikTok</a>}</div>{connected&&<><textarea value={caption} onChange={e=>setCaption(e.target.value)} maxLength={2200} placeholder="Tulis caption untuk TikTok…" className="mt-5 min-h-24 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none placeholder:text-slate-600"/>{creator?.privacy_level_options?.length ? <select value={privacy} onChange={e=>setPrivacy(e.target.value)} className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white">{creator.privacy_level_options.map(v=><option key={v} value={v}>{v.replaceAll('_',' ')}</option>)}</select>:null}<label className="mt-4 flex cursor-pointer gap-3 text-sm text-slate-400"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-1"/>Saya menyetujui video ini dikirim ke akun TikTok saya.</label><div className="mt-4 flex flex-wrap gap-3"><button disabled={!consent||busy} onClick={()=>post('direct')} className="rounded-xl bg-pink-400 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-40">{busy?'Mengirim…':'🚀 Post ke TikTok'}</button><button disabled={!consent||busy} onClick={()=>post('draft')} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-black text-white disabled:opacity-40">📥 Kirim sebagai Draft</button></div>{message&&<div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300">{message}</div>}{publishId&&<div className="mt-2 text-xs text-slate-600">Publish ID: {publishId}</div>}</>}</section>;
}
