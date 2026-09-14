'use client';

import { useState } from 'react';
import { ModePicker } from '../../components/create/mode-picker';
import { SourceInput } from '../../components/create/source-input';
import type { ContentMode } from '../../src/lib/types/core';

export default function CreatePage() {
  const [mode, setMode] = useState<ContentMode>('affiliate');
  const [sourceReady, setSourceReady] = useState(false);
  const [message, setMessage] = useState('');

  return (
    <main className="create-page">
      <header className="app-header">
        <a className="brand" href="/">VidClipMoney</a>
        <span className="header-badge">AI Content Engine</span>
      </header>

      <div className="create-container">
        <section className="create-intro">
          <span className="eyebrow">BUAT KONTEN</span>
          <h1>1 Video → Banyak Konten → Banyak Peluang.</h1>
          <p>Masukkan satu video. VidClipMoney membantu menemukan momen terbaik sesuai tujuan kontenmu.</p>
        </section>

        <div className="create-card">
          <SourceInput
            onSubmit={(source) => {
              setSourceReady(true);
              setMessage(source.kind === 'upload' ? 'Video siap diproses.' : 'URL YouTube siap diproses.');
            }}
          />

          <ModePicker value={mode} onChange={setMode} />

          <section className="review-box" aria-live="polite">
            <div>
              <span className="review-label">MODE TERPILIH</span>
              <strong>{mode.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}</strong>
            </div>
            <div>
              <span className="review-label">SUMBER</span>
              <strong>{sourceReady ? 'Siap diproses' : 'Belum dipilih'}</strong>
            </div>
          </section>

          {message ? <p className="success-message">{message}</p> : null}

          <button
            type="button"
            className="primary-button create-button"
            disabled={!sourceReady}
            onClick={() => setMessage('Permintaan analisis siap dikirim ke AI Content Engine.')}
          >
            Analisis Video dengan AI →
          </button>
        </div>
      </div>
    </main>
  );
}
