'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toggleCaptions, updateCopy, updateTrim, type EditorState } from '../../src/lib/editor';

const initialState: EditorState = { clipId: '', startMs: 0, endMs: 30000, captionsEnabled: true, content: { hook: 'Ini bagian yang paling menarik.', title: 'Potongan terbaik dari video', caption: 'Ringkas, jelas, dan siap dipublikasikan.', cta: 'Simpan dan publikasikan.', hashtags: ['#vidclipmoney', '#konten'] } };

export default function EditorPage() {
  const searchParams = useSearchParams();
  const clipId = searchParams.get('clip') || '';
  const [state, setState] = useState({ ...initialState, clipId });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const seconds = Math.max(1, Math.round((state.endMs - state.startMs) / 1000));
  async function save() {
    if (!clipId) { setMessage('Buka editor dari clip hasil terlebih dahulu.'); return; }
    setBusy(true); setMessage('Menyimpan…');
    try { const response = await fetch(`/api/clips/${clipId}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ startMs: state.startMs, endMs: state.endMs, title: state.content.title, caption: state.content.caption }) }); if (!response.ok) { const body = await response.json() as { error?: string }; throw new Error(body.error || 'CLIP_UPDATE_FAILED'); } setMessage('Perubahan editor tersimpan.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'CLIP_UPDATE_FAILED'); } finally { setBusy(false); }
  }
  return <main className="editor-shell"><header className="app-header"><a className="brand" href="/">VidClipMoney</a><a className="secondary-button" href="/results">Hasil</a></header><section className="editor-container"><p className="eyebrow">LIGHT EDITOR</p><h1>Rapikan clip sebelum publish.</h1><p className="editor-lead">Trim bagian awal/akhir, ubah copy, lalu simpan versi final.</p><section className="editor-preview" aria-label="Preview clip"><span>9:16</span><strong>▶</strong><small>{seconds} detik</small></section><section className="editor-card"><label>Mulai (detik)<input type="number" min="0" value={Math.round(state.startMs / 1000)} onChange={(e) => { const value = Number(e.target.value) * 1000; if (value < state.endMs) { setState(updateTrim(state, value, state.endMs)); setMessage(''); } }} /></label><label>Selesai (detik)<input type="number" min="1" value={Math.round(state.endMs / 1000)} onChange={(e) => { const value = Number(e.target.value) * 1000; if (value > state.startMs) { setState(updateTrim(state, state.startMs, value)); setMessage(''); } }} /></label><label>Hook<textarea value={state.content.hook} onChange={(e) => { setState(updateCopy(state, { hook: e.target.value })); setMessage(''); }} /></label><label>Judul<textarea value={state.content.title} onChange={(e) => { setState(updateCopy(state, { title: e.target.value })); setMessage(''); }} /></label><label>Caption<textarea value={state.content.caption} onChange={(e) => { setState(updateCopy(state, { caption: e.target.value })); setMessage(''); }} /></label><button type="button" className="secondary-button" onClick={() => { setState(toggleCaptions(state)); setMessage(''); }}>{state.captionsEnabled ? 'Caption: ON' : 'Caption: OFF'}</button><button type="button" className="primary-button" disabled={busy} onClick={save}>{busy ? 'Menyimpan…' : 'Simpan perubahan'}</button>{message ? <p className="success-message" role="status">{message}</p> : null}</section></section></main>;
}
