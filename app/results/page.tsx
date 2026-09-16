const clips = [
  { id: '1', title: 'Contoh Clip AI', score: 86, duration: '00:35', reason: 'Hook kuat dan relevan dengan mode konten.', preview: '/api/clips/1/preview', download: '/api/clips/1/download' },
  { id: '2', title: 'Insight yang Bisa Dipakai', score: 82, duration: '00:31', reason: 'Struktur jelas dan mudah dipahami.', preview: '/api/clips/2/preview', download: '/api/clips/2/download' },
  { id: '3', title: 'Poin Penting dari Video', score: 79, duration: '00:42', reason: 'Potensi retention dan shareability baik.', preview: '/api/clips/3/preview', download: '/api/clips/3/download' },
];

export default function ResultsPage() {
  return (
    <main className="results-shell">
      <header className="results-header">
        <div><p className="eyebrow">VIDCLIPMONEY</p><h1>Hasil Konten</h1><p>Video kamu sudah dianalisis. Pilih clip yang ingin dipreview atau diunduh.</p></div>
        <a className="secondary-button" href="/create">Buat Konten Lagi</a>
      </header>
      <section className="clip-grid" aria-label="Daftar clip">
        {clips.map((clip) => (
          <article className="clip-card" key={clip.id}>
            <div className="clip-preview"><div><span>9:16</span><strong>▶</strong><small>{clip.duration}</small></div></div>
            <div className="clip-content"><div className="score-row"><span>AI Score</span><b>{clip.score}</b></div><h2>{clip.title}</h2><p>{clip.reason}</p><div className="action-row"><a className="secondary-button" href={clip.preview}>Preview</a><a className="primary-button" href={clip.download}>Download</a></div></div>
          </article>
        ))}
      </section>
    </main>
  );
}
