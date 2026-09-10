'use client';

import { useEffect, useMemo, useState } from 'react';
import { sanitizeViralEditorControls, VIRAL_EDITOR_EFFECTS, type ViralEditorFormat, type ViralEditorPunchIn, type ViralEditorSubtitleStyle } from '@/lib/viral-editor-controls';

type Plan = {
  score: number;
  subtitle?: { style?: string; hook?: { text?: string } };
  effects?: string[];
  punchIns?: ViralEditorPunchIn[];
  hook?: { text?: string; start?: number; end?: number };
  emphasis?: Array<{ text?: string; start?: number; end?: number }>;
  cta?: { text?: string; start?: number; end?: number };
};

type Props = {
  projectId: string;
  duration: number;
  initialFormat: ViralEditorFormat;
  plan: Plan | null;
  status: string;
  onSaved?: (controls: { format: ViralEditorFormat; subtitleStyle: ViralEditorSubtitleStyle; effects: string[]; punchIns: ViralEditorPunchIn[] }) => void;
};

const FORMATS: ViralEditorFormat[] = ['9:16', '1:1', '16:9'];
const SUBTITLE_STYLES: Array<{ value: ViralEditorSubtitleStyle; label: string }> = [
  { value: 'bold-pop', label: 'Bold Pop' },
  { value: 'viral-punch', label: 'Viral Punch' },
  { value: 'karaoke', label: 'Karaoke' },
  { value: 'neon', label: 'Neon' },
  { value: 'clean', label: 'Clean' },
  { value: 'cinematic', label: 'Cinematic' },
];

export default function ViralEditorControls({ projectId, duration, initialFormat, plan, status, onSaved }: Props) {
  const initial = useMemo(() => sanitizeViralEditorControls({
    format: initialFormat,
    subtitleStyle: plan?.subtitle?.style,
    effects: plan?.effects,
    punchIns: plan?.punchIns,
    duration,
  }), [duration, initialFormat, plan]);
  const [format, setFormat] = useState(initial.format);
  const [subtitleStyle, setSubtitleStyle] = useState(initial.subtitleStyle);
  const [effects, setEffects] = useState<string[]>(initial.effects);
  const [punchInsEnabled, setPunchInsEnabled] = useState(initial.punchIns.length > 0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setFormat(initial.format);
    setSubtitleStyle(initial.subtitleStyle);
    setEffects(initial.effects);
    setPunchInsEnabled(initial.punchIns.length > 0);
  }, [initial]);

  const punchIns = punchInsEnabled
    ? (plan?.punchIns?.length ? plan.punchIns : [{ start: 0, end: Math.min(3, duration), strength: 'strong' as const }])
    : [];
  const locked = status === 'processing' || status === 'queued';

  function toggleEffect(effect: string) {
    setEffects(current => current.includes(effect) ? current.filter(item => item !== effect) : [...current, effect]);
  }

  async function save() {
    setSaving(true);
    setMessage('');
    try {
      const controls = sanitizeViralEditorControls({ format, subtitleStyle, effects, punchIns, duration });
      const response = await fetch(`/api/projects/${projectId}/edit-plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...controls, duration }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? 'Perubahan editor gagal disimpan.');
      setMessage('✓ Tersimpan — render berikutnya memakai pengaturan ini.');
      onSaved?.(controls);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Perubahan editor gagal disimpan.');
    } finally {
      setSaving(false);
    }
  }

  return <section className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">AI Viral Editor</div>
        <h2 className="mt-2 text-lg font-black">Kontrol hasil AI sebelum render ulang</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">AI tetap memilih momen. Kamu mengatur format, subtitle, efek, dan punch-in tanpa menyentuh timeline rumit.</p>
      </div>
      {plan && <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-right"><div className="text-[9px] font-bold uppercase text-emerald-300">Viral Score</div><div className="text-xl font-black text-emerald-200">{plan.score}/100</div></div>}
    </div>

    {plan && <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-cyan-300/10 bg-cyan-300/[0.04] p-3"><div className="text-[9px] font-black uppercase text-cyan-300">HOOK</div><div className="mt-1 text-xs leading-5 text-white">{plan.hook?.text ?? 'AI belum memilih hook'}</div></div>
      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3"><div className="text-[9px] font-black uppercase text-slate-500">EMPHASIS</div><div className="mt-1 text-xs leading-5 text-slate-300">{plan.emphasis?.slice(0, 2).map(item => item.text).filter(Boolean).join(' • ') || 'Otomatis'}</div></div>
      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3"><div className="text-[9px] font-black uppercase text-slate-500">CTA</div><div className="mt-1 text-xs leading-5 text-slate-300">{plan.cta?.text ?? 'AI akan memilih bila tersedia'}</div></div>
    </div>}

    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <div>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Format</div>
        <div className="grid grid-cols-3 gap-2">{FORMATS.map(value => <button key={value} type="button" disabled={locked} onClick={() => setFormat(value)} className={`rounded-xl border px-3 py-3 text-xs font-black transition ${format === value ? 'border-cyan-300 bg-cyan-300/10 text-cyan-200' : 'border-white/10 text-slate-500'} disabled:opacity-40`}>{value}</button>)}</div>
      </div>
      <div>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Subtitle</div>
        <select value={subtitleStyle} disabled={locked} onChange={event => setSubtitleStyle(event.target.value as ViralEditorSubtitleStyle)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-xs font-bold text-white outline-none disabled:opacity-40">{SUBTITLE_STYLES.map(style => <option key={style.value} value={style.value}>{style.label}</option>)}</select>
      </div>
    </div>

    <div className="mt-5">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Effects</div>
      <div className="flex flex-wrap gap-2">{VIRAL_EDITOR_EFFECTS.map(effect => <button key={effect} type="button" disabled={locked} onClick={() => toggleEffect(effect)} className={`rounded-full border px-3 py-2 text-[10px] font-black ${effects.includes(effect) ? 'border-cyan-300 bg-cyan-300/10 text-cyan-200' : 'border-white/10 text-slate-500'} disabled:opacity-40`}>{effects.includes(effect) ? '✓ ' : ''}{effect}</button>)}</div>
    </div>

    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div><div className="text-xs font-black">Punch-in otomatis</div><div className="mt-1 text-[10px] text-slate-500">Zoom fokus pada hook dan bagian penting.</div></div>
      <button type="button" disabled={locked} onClick={() => setPunchInsEnabled(value => !value)} className={`rounded-full border px-4 py-2 text-[10px] font-black ${punchInsEnabled ? 'border-cyan-300 bg-cyan-300/10 text-cyan-200' : 'border-white/10 text-slate-500'} disabled:opacity-40`}>{punchInsEnabled ? 'AKTIF' : 'MATI'}</button>
    </div>

    <div className="mt-5 flex flex-wrap items-center gap-3">
      <button type="button" disabled={locked || saving} onClick={() => void save()} className="rounded-xl bg-cyan-300 px-5 py-3 text-xs font-black text-slate-950 disabled:opacity-40">{saving ? 'Menyimpan…' : 'Simpan pengaturan'}</button>
      {locked && <span className="text-[10px] font-bold text-amber-300">Editor terkunci selama render.</span>}
      {message && <span className="text-[10px] font-bold text-slate-400">{message}</span>}
    </div>
  </section>;
}
