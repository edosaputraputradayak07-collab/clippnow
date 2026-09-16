import { getCurrentUser } from '../../src/lib/auth';
import { createSupabaseServerClient } from '../../src/lib/supabase/server';

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) return <main className="results-shell"><section className="empty-results"><h1>Analytics</h1><p>Masuk untuk melihat penggunaan VidClipMoney.</p></section></main>;
  const supabase = await createSupabaseServerClient();
  const { data: events } = await supabase.from('usage_events').select('event_type,credits,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100);
  const totalCredits = events?.reduce((sum, event) => sum + Number(event.credits || 0), 0) ?? 0;
  const completed = events?.filter((event) => event.event_type === 'job_completed').length ?? 0;
  return <main className="results-shell"><header className="results-header"><div><p className="eyebrow">ANALYTICS</p><h1>Performa penggunaan</h1><p>Ringkasan event engine yang tercatat untuk akunmu.</p></div><a className="secondary-button" href="/dashboard">Dashboard</a></header><section className="stats-grid"><div className="stat-card"><span>Credits tercatat</span><strong>{totalCredits}</strong></div><div className="stat-card"><span>Job selesai</span><strong>{completed}</strong></div></section><section className="project-list"><h2>Event terbaru</h2>{events?.length ? events.slice(0, 20).map((event, index) => <div className="project-row" key={`${event.created_at}-${index}`}><div><strong>{event.event_type}</strong><small>{new Date(event.created_at).toLocaleString('id-ID')}</small></div><span>{event.credits}</span></div>) : <div className="empty-results"><h3>Belum ada data</h3><p>Data akan muncul setelah engine digunakan.</p></div>}</section></main>;
}
