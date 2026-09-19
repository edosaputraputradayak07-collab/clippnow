'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [message, setMessage] = useState('');
  return <main className="results-shell"><header className="results-header"><div><p className="eyebrow">SETTINGS</p><h1>Pengaturan akun</h1><p>Preferensi dasar VidClipMoney. Secret dan service credentials tidak pernah ditampilkan di browser.</p></div><a className="secondary-button" href="/dashboard">Dashboard</a></header><section className="editor-card"><label>Bahasa output<select defaultValue="id"><option value="id">Bahasa Indonesia</option></select></label><label>Mode default<select defaultValue="affiliate"><option value="affiliate">TikTok Affiliate</option><option value="seller">Seller / UMKM</option><option value="live_seller">Live Seller</option><option value="podcast">Podcaster</option><option value="educator">Educator / Personal Brand</option></select></label><button className="primary-button" type="button" onClick={() => setMessage('Preferensi tersimpan untuk sesi ini.')}>Simpan preferensi</button>{message ? <p className="success-message" role="status">{message}</p> : null}</section></main>;
}
