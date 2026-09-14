'use client';

import { useState } from 'react';

type SourceInputProps = {
  onSubmit: (source: { kind: 'upload' | 'youtube'; value: File | string }) => void;
};

export function SourceInput({ onSubmit }: SourceInputProps) {
  const [kind, setKind] = useState<'upload' | 'youtube'>('upload');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const canSubmit = kind === 'upload' ? Boolean(file) : url.trim().length > 0;

  return (
    <section className="source-input" aria-labelledby="source-title">
      <div>
        <h2 id="source-title" className="section-title">Masukkan video</h2>
        <p className="section-copy">Upload video atau tempel URL YouTube yang ingin diubah menjadi klip.</p>
      </div>

      <div className="source-tabs" role="tablist" aria-label="Sumber video">
        <button
          type="button"
          role="tab"
          aria-selected={kind === 'upload'}
          className={kind === 'upload' ? 'source-tab source-tab-active' : 'source-tab'}
          onClick={() => setKind('upload')}
        >
          Upload Video
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={kind === 'youtube'}
          className={kind === 'youtube' ? 'source-tab source-tab-active' : 'source-tab'}
          onClick={() => setKind('youtube')}
        >
          YouTube URL
        </button>
      </div>

      {kind === 'upload' ? (
        <label className="upload-box">
          <span className="upload-title">Pilih video</span>
          <span className="upload-copy">MP4, MOV, atau WebM</span>
          <input
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          {file ? <span className="selected-file">{file.name}</span> : null}
        </label>
      ) : (
        <label className="url-box">
          <span className="input-label">URL YouTube</span>
          <input
            type="url"
            inputMode="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
        </label>
      )}

      <button
        type="button"
        className="primary-button"
        disabled={!canSubmit}
        onClick={() => {
          if (kind === 'upload' && file) onSubmit({ kind, value: file });
          if (kind === 'youtube' && url.trim()) onSubmit({ kind, value: url.trim() });
        }}
      >
        Lanjutkan ke Mode AI →
      </button>
    </section>
  );
}
