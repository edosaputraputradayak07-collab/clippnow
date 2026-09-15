'use client';

import { useRef, useState } from 'react';
import { createSupabaseBrowserClient } from '../../src/lib/supabase/browser';
import { MAX_SOURCE_VIDEO_BYTES, SOURCE_VIDEO_BUCKET, validateSourceVideo } from '../../src/lib/media';

type VideoUploaderProps = {
  projectId: string;
  onComplete: (sourcePath: string) => void;
};

export function VideoUploader({ projectId, onComplete }: VideoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState('Pilih video untuk upload.');
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    const validationError = validateSourceVideo({ contentType: file.type, size: file.size });
    if (validationError) {
      setStatus(validationError === 'VIDEO_TOO_LARGE' ? `Ukuran maksimal ${MAX_SOURCE_VIDEO_BYTES / 1024 / 1024} MB.` : 'Format video harus MP4, MOV, atau WebM.');
      return;
    }

    setBusy(true);
    setStatus('Menyiapkan upload aman...');

    try {
      const prepareResponse = await fetch(`/api/projects/${projectId}/upload`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phase: 'prepare', filename: file.name, contentType: file.type, size: file.size }),
      });
      const prepared = await prepareResponse.json() as { error?: string; sourcePath?: string; token?: string };
      if (!prepareResponse.ok || !prepared.sourcePath || !prepared.token) throw new Error(prepared.error ?? 'UPLOAD_PREPARE_FAILED');

      setStatus('Mengupload video...');
      const supabase = createSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage.from(SOURCE_VIDEO_BUCKET).uploadToSignedUrl(prepared.sourcePath, prepared.token, file);
      if (uploadError) throw new Error('UPLOAD_FAILED');

      setStatus('Menyimpan sumber video...');
      const completeResponse = await fetch(`/api/projects/${projectId}/upload`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phase: 'complete', sourcePath: prepared.sourcePath }),
      });
      const completed = await completeResponse.json() as { error?: string };
      if (!completeResponse.ok) throw new Error(completed.error ?? 'UPLOAD_COMPLETE_FAILED');

      setStatus('Video berhasil diupload.');
      onComplete(prepared.sourcePath);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'UPLOAD_FAILED');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="upload-box">
      <button type="button" className="primary-button" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? 'Memproses...' : 'Pilih & Upload Video'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.target.value = '';
        }}
      />
      <p className="section-copy" aria-live="polite">{status}</p>
    </div>
  );
}
