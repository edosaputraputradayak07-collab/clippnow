import { getCurrentUser } from '../../src/lib/auth';
import { createSupabaseServerClient } from '../../src/lib/supabase/server';

export type ResultClip = { id: string; title: string; score: number; duration: string; reason: string; preview: string; download: string };

export function ResultsView({ clips }: { clips: ResultClip[] }) {
  return <main className="results-shell"><header className="results-header"><div><p className="eyebrow">VIDCLIPMONEY</p><h1>Hasil Konten</h1><p>Video kamu sudah dianalisis. Pilih clip untuk preview, edit, atau download.</p></div><a className="secondary-button" href="/create">Buat Konten Lagi</a></header>{clips.length === 0 ? <section className="empty-results"><h2>Belum ada clip</h2><p>Clip akan muncul di sini setelah proses AI dan rendering selesai.</p></section> : <section className="clip-grid" aria-label="Daftar clip">{clips.map((clip) => <article className="clip-card" key={clip.id}><div className="clip-preview"><div><span>9:16</span><strong>▶</strong><small>{clip.duration}</small></div></div><div className="clip-content"><div className="score-row"><span>AI Score</span><b>{clip.score}</b></div><h2>{clip.title}</h2><p>{clip.reason}</p><div className="action-row"><a className="secondary-button" href={`/editor?clip=${clip.id}`}>Edit</a><a className="secondary-button" href={clip.preview} target="_blank" rel="noreferrer">Preview</a><a className="primary-button" href={clip.download}>Download</a></div></div></article>)}</section>}</main>;
}

export default async function ResultsPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  const user = await getCurrentUser();
  if (!user) return <ResultsView clips={[]} />;
  const { project } = await searchParams;
  if (!project) return <ResultsView clips={[]} />;
  const supabase = await createSupabaseServerClient();
  const { data: clips } = await supabase.from('clips').select('id,title,score,caption,output_path,status,start_ms,end_ms,ai_score,metadata').eq('project_id', project).eq('user_id', user.id).order('rank', { ascending: true, nullsFirst: false }).order('created_at', { ascending: true });
  const results: ResultClip[] = [];
  for (const clip of clips || []) { if (!clip.output_path || clip.status === 'failed') continue; const { data: signed } = await supabase.storage.from('rendered-clips').createSignedUrl(clip.output_path, 3600); if (!signed?.signedUrl) continue; const seconds = Math.max(1, Math.round((Number(clip.end_ms) - Number(clip.start_ms)) / 1000)); results.push({ id: clip.id, title: clip.title, score: Number(clip.ai_score ?? clip.score ?? 0), duration: `${seconds}s`, reason: clip.caption || 'Clip dipilih berdasarkan relevansi mode dan skor AI.', preview: signed.signedUrl, download: signed.signedUrl }); }
  return <ResultsView clips={results} />;
}
