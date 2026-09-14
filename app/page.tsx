import Link from 'next/link';

const modes = [
  ['Affiliate', 'CTA, produk, dan konversi'],
  ['Seller / UMKM', 'Storytelling, edukasi, dan trust'],
  ['Live Seller', 'Energi, FOMO, promo, dan interaksi'],
  ['Podcast', 'Hook dialog dan insight'],
  ['Educator', 'Transkrip, nilai, dan otoritas'],
] as const;

export default function Home() {
  return (
    <main className="landing-page">
      <header className="app-header landing-header">
        <Link className="brand" href="/">VidClipMoney</Link>
        <span className="header-badge">AI Content Engine</span>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">VIDEO → CONTENT ENGINE</span>
          <h1>1 Video → Banyak Konten → Banyak Peluang.</h1>
          <p>Temukan momen terbaik dari videomu, ubah menjadi klip vertikal, dan siapkan konten sesuai tujuanmu.</p>
          <Link className="primary-button hero-button" href="/create">Buat Konten →</Link>
          <p className="trust-note">Mulai tanpa ribet. Pilih video dan mode AI yang paling sesuai.</p>
        </div>

        <div className="hero-preview" aria-label="Pratinjau AI Content Engine">
          <div className="preview-top"><span>AI CONTENT ENGINE</span><span>● READY</span></div>
          <div className="preview-screen">
            <span className="play-icon">▶</span>
            <div className="preview-caption">AI mencari momen paling bernilai...</div>
          </div>
          <div className="preview-stats"><span>5 Mode AI</span><span>9:16</span><span>3–5 Klip</span></div>
        </div>
      </section>

      <section className="modes-section" aria-labelledby="modes-title">
        <div>
          <span className="eyebrow">SATU ENGINE · 5 MODE</span>
          <h2 id="modes-title">AI bekerja sesuai tujuan kontenmu.</h2>
        </div>
        <div className="mode-summary-grid">
          {modes.map(([name, description]) => (
            <article className="mode-summary" key={name}>
              <strong>{name}</strong>
              <span>{description}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
