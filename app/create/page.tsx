'use client';

import { useState } from 'react';
import { GoogleSignInButton } from '../../components/auth/google-sign-in-button';
import { ModePicker } from '../../components/create/mode-picker';
import { SourceInput } from '../../components/create/source-input';
import { createSupabaseBrowserClient } from '../../src/lib/supabase/browser';
import type { ContentMode } from '../../src/lib/types/core';

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const durationMs = Math.round(video.duration * 1000);
      URL.revokeObjectURL(url);
      video.remove();
      if (!Number.isFinite(durationMs) || durationMs <= 0) reject(new Error('VIDEO_DURATION_UNAVAILABLE'));
      else resolve(durationMs);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      video.remove();
      reject(new Error('VIDEO_METADATA_READ_FAILED'));
    };
    video.src = url;
  });
}

export default function CreatePage() {
  const [mode, setMode] = useState<ContentMode>('affiliate');
  const [source, setSource] = useState<File | string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function startProcessing() {
    if (!source) return;
    setBusy(true); setMessage('Membaca durasi video…');
    try {
      const isFile = source instanceof File;
      const durationMs = isFile
        ? await readVideoDuration(source)
        : await (async () => {
            const response = await fetch('/api/source-metadata', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sourceType: 'youtube', sourceUrl: source }) });
            const body = await response.json() as { error?: string; durationMs?: number };
            if (!response.ok || !body.durationMs) throw new Error(body.error || 'YOUTUBE_DURATION_UNAVAILABLE');
            return body.durationMs;
          })();

      const idempotencyKey = crypto.randomUUID();
      setMessage('Menyiapkan project…');
      const projectResponse = await fetch('/api/projects', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode, sourceType: isFile ? 'upload' : 'youtube', sourceUrl: isFile ? undefined : source, originalFilename: isFile ? source.name : undefined, durationMs, idempotencyKey }) });
      const projectBody = await projectResponse.json() as { error?: string; project?: { id: string } };
      if (!projectResponse.ok || !projectBody.project) throw new Error(projectBody.error || 'PROJECT_CREATE_FAILED');
      const projectId = projectBody.project.id;
      if (isFile) {
        setMessage('Menyiapkan upload aman…');
        const prepareResponse = await fetch(`/api/projects/${projectId}/upload`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phase: 'prepare', filename: source.name, contentType: source.type, size: source.size }) });
        const prepareBody = await prepareResponse.json() as { error?: string; sourcePath?: string; token?: string };
        if (!prepareResponse.ok || !prepareBody.sourcePath || !prepareBody.token) throw new Error(prepareBody.error || 'UPLOAD_PREPARE_FAILED');
        const supabase = createSupabaseBrowserClient();
        const { error: uploadError } = await supabase.storage.from('source-videos').uploadToSignedUrl(prepareBody.sourcePath, prepareBody.token, source);
        if (uploadError) throw new Error(`UPLOAD_FAILED:${uploadError.message}`);
        const completeResponse = await fetch(`/api/projects/${projectId}/upload`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phase: 'complete', sourcePath: prepareBody.sourcePath }) });
        if (!completeResponse.ok) throw new Error('UPLOAD_COMPLETE_FAILED');
      }
      setMessage('Mengecek credit dan memasukkan job ke queue…');
      const processResponse = await fetch(`/api/projects/${projectId}/process`, { method: 'POST' });
      const processBody = await processResponse.json() as { error?: string; job?: { id: string } };
      if (!processResponse.ok || !processBody.job) throw new Error(processBody.error || 'PROCESS_START_FAILED');
      window.location.href = `/results?project=${projectId}&job=${processBody.job.id}`;
    } catch (error) {
      const text = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
      setMessage(text === 'INSUFFICIENT_CREDITS' ? 'Credit tidak cukup. Buka Pricing untuk menambah credit.' : text);
    } finally { setBusy(false); }
  }

  return <main className="create-page"><header className="app-header"><a className="brand" href="/">VidClipMoney</a><span className="header-badge">AI Content Engine</span></header><div className="create-container"><section className="create-intro"><span className="eyebrow">BUAT KONTEN</span><h1>1 Video → Banyak Konten → Banyak Peluang.</h1><p>Masukkan satu video. VidClipMoney menemukan momen terbaik sesuai tujuan kontenmu.</p></section><div className="create-card"><SourceInput onSubmit={(next) => { setSource(next.value); setMessage('Sumber video siap.'); }} /><ModePicker value={mode} onChange={setMode} /><section className="review-box" aria-live="polite"><div><span className="review-label">MODE</span><strong>{mode}</strong></div><div><span className="review-label">SUMBER</span><strong>{source ? 'Siap' : 'Belum dipilih'}</strong></div></section>{message ? <p className="success-message">{message}</p> : null}<button type="button" className="primary-button create-button" disabled={!source || busy} onClick={startProcessing}>{busy ? 'Memproses…' : 'Analisis Video dengan AI →'}</button><div className="auth-divider"><span>Login diperlukan untuk menyimpan project</span><GoogleSignInButton next="/create" /></div></div></div></main>;
}
