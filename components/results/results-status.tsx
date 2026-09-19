'use client';

import { useEffect, useState } from 'react';

type Props = {
  projectId: string;
  jobId: string;
  initialStatus: string;
  initialEngineStatus: string;
  initialError?: string | null;
};

const labels: Record<string, string> = {
  queued: 'Menunggu worker',
  processing: 'AI sedang bekerja',
  completed: 'Selesai',
  failed: 'Proses gagal',
};

export function ResultsStatus({ projectId, jobId, initialStatus, initialEngineStatus, initialError }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [engineStatus, setEngineStatus] = useState(initialEngineStatus);
  const [error, setError] = useState(initialError ?? '');
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (status !== 'queued' && status !== 'processing') return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/jobs/${jobId}`, { cache: 'no-store' });
      if (!response.ok) return;
      const body = await response.json() as { status?: string; engineStatus?: string; error?: string | null };
      if (body.status) setStatus(body.status);
      if (body.engineStatus) setEngineStatus(body.engineStatus);
      if (body.error) setError(body.error);
      if (body.status === 'completed') window.location.reload();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [jobId, status]);

  async function retry() {
    setRetrying(true);
    setError('');
    const response = await fetch(`/api/jobs/${jobId}/retry`, { method: 'POST' });
    const body = await response.json() as { job?: { id: string }; error?: string };
    if (!response.ok || !body.job) {
      setError(body.error ?? 'RETRY_FAILED');
      setRetrying(false);
      return;
    }
    window.location.href = `/results?project=${projectId}&job=${body.job.id}`;
  }

  const failed = status === 'failed' || engineStatus === 'FAILED';
  return <section className="processing-panel" aria-live="polite">
    <div className="processing-orb">{failed ? '!' : 'AI'}</div>
    <h2>{labels[status] ?? engineStatus}</h2>
    {failed ? (
      <>
        <p>Job tidak selesai. Kamu bisa menjalankan ulang proses dengan job baru.</p>
        {error ? <p role="alert" className="error-message">{error}</p> : null}
        <button className="primary-button" type="button" disabled={retrying} onClick={retry}>{retrying ? 'Menyiapkan ulang…' : 'Coba Lagi'}</button>
      </>
    ) : (
      <>
        <p>Status diperbarui otomatis setiap 3 detik. Tidak perlu menekan Scan.</p>
        <div className="processing-steps"><span>● {engineStatus}</span><span>○ Render video 9:16</span><span>○ Siapkan download</span></div>
      </>
    )}
  </section>;
}
