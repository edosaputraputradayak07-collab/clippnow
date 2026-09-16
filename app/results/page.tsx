export type ResultClip = { id: string; title: string; score: number; duration: string; reason: string; preview: string; download: string };

export function ResultsView({ clips }: { clips: ResultClip[] }) {
  return (
    <main className="results-shell">
      <header className="results-header">
        <div><p className="eyebrow">VIDCLIPMONEY</p><h1>Hasil Konten</h1><p>Video kamu sudah dianalisis. Pilih clip untuk preview atau download.</p></div>
        <a className="secondary-button" href="/create">Buat Konten Lagi</a>
      </header>
      {clips.length === 0 ? <section className="empty-results"><h2>Belum ada clip</h2><p>Clip akan muncul di sini setelah proses AI dan rendering selesai.</p></section> : (
        <section className="clip-grid" aria-label="Daftar clip">
          {clips.map((clip) => <article className="clip-card" key={clip.id}>
            <div className="clip-preview"><div><span>9:16</span><strong>▶</strong><small>{clip.duration}</small></div></div>
            <div className="clip-content"><div className="score-row"><span>AI Score</span><b>{clip.score}</b></div><h2>{clip.title}</h2><p>{clip.reason}</p><div className="action-row"><a className="secondary-button" href={clip.preview}>Preview</a><a className="primary-button" href={clip.download}>Download</a></div></div>
          </article>)}
        </section>
      )}
    </main>
  );
}

export default function ResultsPage() {
  return <ResultsView clips={[]} />;
}
