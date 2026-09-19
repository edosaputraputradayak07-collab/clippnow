import { getCurrentUser } from '../../src/lib/auth';
import { createSupabaseAdminClient } from '../../src/lib/supabase/admin';

export default async function AdminPage() {
  const user = await getCurrentUser();
  const allowed = Boolean(user && process.env.ADMIN_USER_IDS?.split(',').map((id) => id.trim()).includes(user.id));
  if (!allowed) return <main className="results-shell"><section className="empty-results"><h1>Admin</h1><p>Akses admin tidak tersedia untuk akun ini.</p></section></main>;
  const supabase = createSupabaseAdminClient();
  const [{ data: jobs }, { data: payments }, { data: events }] = await Promise.all([
    supabase.from('jobs').select('id,engine_status,attempts,created_at').order('created_at', { ascending: false }).limit(50),
    supabase.from('payments').select('id,provider,status,amount,credits,created_at').order('created_at', { ascending: false }).limit(50),
    supabase.from('usage_events').select('event_type,credits,created_at').order('created_at', { ascending: false }).limit(50),
  ]);
  return <main className="results-shell"><header className="results-header"><div><p className="eyebrow">OPERATIONS</p><h1>Admin</h1><p>Observability ringan untuk job, payment, dan usage.</p></div><a className="secondary-button" href="/dashboard">Dashboard</a></header><section className="project-list"><h2>Jobs</h2>{jobs?.map((job) => <div className="project-row" key={job.id}><div><strong>{job.engine_status}</strong><small>{job.attempts ?? 0} attempts · {new Date(job.created_at).toLocaleString('id-ID')}</small></div><span>{job.id.slice(0, 8)}</span></div>)}</section><section className="project-list"><h2>Payments</h2>{payments?.map((payment) => <div className="project-row" key={payment.id}><div><strong>{payment.status}</strong><small>{payment.provider} · Rp {Number(payment.amount).toLocaleString('id-ID')}</small></div><span>{payment.credits} cr</span></div>)}</section><section className="project-list"><h2>Usage</h2>{events?.map((event, index) => <div className="project-row" key={`${event.created_at}-${index}`}><div><strong>{event.event_type}</strong><small>{new Date(event.created_at).toLocaleString('id-ID')}</small></div><span>{event.credits}</span></div>)}</section></main>;
}
