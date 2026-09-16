const PACKAGES = [{ credits: 10, price: 'Rp25.000', label: 'Starter' }, { credits: 30, price: 'Rp65.000', label: 'Creator' }, { credits: 100, price: 'Rp190.000', label: 'Pro' }];

export default function PricingPage() {
  return <main className="results-shell"><header className="results-header"><div><p className="eyebrow">VIDCLIPMONEY</p><h1>Credit untuk proses AI</h1><p>Perhitungan dasar: 1 credit per menit video yang diproses.</p></div><a className="secondary-button" href="/dashboard">Dashboard</a></header><section className="clip-grid">{PACKAGES.map((pack) => <article className="clip-card" key={pack.credits}><div className="clip-content"><p className="eyebrow">{pack.label}</p><h2>{pack.credits} Credits</h2><p>{pack.price}</p><button className="primary-button" type="button" disabled>Checkout perlu payment provider</button></div></article>)}</section></main>;
}
