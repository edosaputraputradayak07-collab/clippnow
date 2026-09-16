import { getCurrentUser } from '../../src/lib/auth';
import { createSupabaseServerClient } from '../../src/lib/supabase/server';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return <main className="results-shell"><section className="empty-results"><h1>Masuk ke VidClipMoney</h1><p>Login diperlukan untuk melihat project, credits, dan riwayat.</p><a className="primary-button" href="/create">Mulai Buat Konten</a></section></main>;
  const supabase = await createSupabaseServerClient();
  const [{ data: projects }, { data: wallet }] = await Promise.all([
    supabase.from('projects').select('id,title,mode,status,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('credit_wallets').select('balance,reserved').eq('user_id', user.id).maybeSingle(),
  ]);
  const balance = wallet?.balance ?? 0; const reserved = wallet?.reserved ?? 0;
  return <main className="results-shell"><header className="results-header"><div><p className="eyebrow">VIDCLIPMONEY</p><h1>Dashboard</h1><p>Kelola project dan lihat credit yang tersedia.</p></div><a className="primary-button" href="/create">Buat Konten</a></header><section className="stats-grid"><div className="stat-card"><span>Credits</span><strong>{balance}</strong><small>{reserved} sedang dipakai</small></div><div className="stat-card"><span>Projects</span><strong>{projects?.length ?? 0}</strong><small>20 terbaru</small></div></section><section className="project-list"><h2>Project terbaru</h2>{projects?.length ? projects.map((project) => <a className="project-row" href={`/results?project=${project.id}`} key={project.id}><div><strong>{project.title}</strong><small>{project.mode} · {project.status}</small></div><span>→</span></a>) : <div className="empty-results"><h3>Belum ada project</h3><p>Mulai dari satu video dan pilih mode AI.</p></div>}</section></main>;
}
