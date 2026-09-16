'use client';

import { useState } from 'react';
import { toggleCaptions, updateCopy, updateTrim, type EditorState } from '../../src/lib/editor';

const initialState: EditorState = {
  clipId: 'demo-clip', startMs: 0, endMs: 30000, captionsEnabled: true,
  content: { hook: 'Ini bagian yang paling menarik.', title: 'Potongan terbaik dari video', caption: 'Ringkas, jelas, dan siap dipublikasikan.', cta: 'Simpan dan publikasikan.', hashtags: ['#vidclipmoney', '#konten'] },
};

export default function EditorPage() {
  const [state, setState] = useState(initialState);
  const [saved, setSaved] = useState(false);
  const seconds = Math.max(1, Math.round((state.endMs - state.startMs) / 1000));
  return (
    <main className="editor-shell">
      <header className="app-header"><a className="brand" href="/">VidClipMoney</a><a className="secondary-button" href="/results">Hasil</a></header>
      <section className="editor-container">
        <p className="eyebrow">LIGHT EDITOR</p><h1>Rapikan clip sebelum publish.</h1><p className="editor-lead">Trim bagian awal/akhir, ubah copy, lalu simpan versi final.</p>
        <section className="editor-preview" aria-label="Preview clip"><span>9:16</span><strong>▶</strong><small>{seconds} detik</small></section>
        <section className="editor-card">
          <label>Mulai (detik)<input type="number" min="0" value={Math.round(state.startMs / 1000)} onChange={(e) => { const value = Number(e.target.value) * 1000; if (value < state.endMs) { setState(updateTrim(state, value, state.endMs)); setSaved(false); } }} /></label>
          <label>Selesai (detik)<input type="number" min="1" value={Math.round(state.endMs / 1000)} onChange={(e) => { const value = Number(e.target.value) * 1000; if (value > state.startMs) { setState(updateTrim(state, state.startMs, value)); setSaved(false); } }} /></label>
          <label>Hook<textarea value={state.content.hook} onChange={(e) => { setState(updateCopy(state, { hook: e.target.value })); setSaved(false); }} /></label>
          <label>Judul<textarea value={state.content.title} onChange={(e) => { setState(updateCopy(state, { title: e.target.value })); setSaved(false); }} /></label>
          <label>Caption<textarea value={state.content.caption} onChange={(e) => { setState(updateCopy(state, { caption: e.target.value })); setSaved(false); }} /></label>
          <button type="button" className="secondary-button" onClick={() => { setState(toggleCaptions(state)); setSaved(false); }}>{state.captionsEnabled ? 'Caption: ON' : 'Caption: OFF'}</button>
          <button type="button" className="primary-button" onClick={() => setSaved(true)}>Simpan perubahan</button>
          {saved ? <p className="success-message" role="status">Perubahan editor tersimpan.</p> : null}
        </section>
      </section>
    </main>
  );
}
