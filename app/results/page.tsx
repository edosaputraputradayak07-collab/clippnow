import Link from 'next/link';
import { getCurrentUser } from '../../src/lib/auth';
import { createSupabaseServerClient } from '../../src/lib/supabase/server';
import { ResultsStatus } from '../../components/results/results-status';

export type ResultClip = { id: string; title: string; score: number; duration: string; reason: string; preview: string; download: string };

export function ResultsView({ clips, processing = false }: { clips: ResultClip[]; processing?: boolean }) {
  return <main className="results-shell">
    <header className="results-header">
      <div><p className="eyebrow">VIDCLIPMONEY</p><h1>{processing ? 'AI sedang bekerja' : 'Hasil Konten'}</h1><p>{processing ? 'Video sedang dianalisis, dipotong, diberi caption, dan dirender menjadi konten vertikal.' : 'Video kamu sudah dianalisis. Pilih clip untuk preview, edit, atau download.'}</p></div>
      <Link className="secondary-button" href="/create">Buat Konten Lagi</Link>
    </header>
    {processing ? <section className="empty-results processing-panel" aria-live="polite"><div className="processing-orb">AI</div><h2>Menyiapkan 3–5 clip terbaik</h2><div className="processing-steps"><span>✓ Analisis video</span><span>✓ Cari momen terbaik</span><span>◉ Render video 9:16</span><span>○ Siapkan download</span></div><p>Halaman ini aman untuk dibuka kembali. Hasil akan muncul setelah worker menyelesaikan job.</p></section> : clips.length === 0 ? <section className="empty-results"><h2>Belum ada clip</h2><p>Clip akan muncul di sini setelah proses AI dan rendering selesai.</p></section> : <section className="clip-grid" aria-label="Daftar clip">{clips.map((clip) => <article className="clip-card" key={clip.id}><div className="clip-preview"><div><span>9:16</span><strong>▶</strong><small>{clip.duration}</small></div></div><div className="clip-content"><div className="score-row"><span>AI Score</span><b>{clip.score}</b></div><h2>{clip.title}</h2><p>{clip.reason}</p><div className="action-row"><Link className="secondary-button" href={`/editor?clip=${clip.id}`}>Edit</Link><a className="secondary-button" href={clip.preview} target="_blank" rel="noreferrer">Preview</a><a className="primary-button" href={clip.download}>Download</a></div></div></article>)}</section>}
  </main>;
}

export default async function ResultsPage({ searchParams }: { searchParams: Promise<{ project?: string; job?: string }> }) {
  const user = await getCurrentUser();
  if (!user) return <ResultsView clips={[]} />;
  const { project, job } = await searchParams;
  if (!project || !job) return <ResultsView clips={[]} />;

  const supabase = await createSupabaseServerClient();
  const { data: jobRow } = await supabase
    .from('jobs')
    .select('status,engine_status,error_details')
    .eq('id', job)
    .eq('project_id', project)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!jobRow) return <ResultsView clips={[]} />;

  const { data: clips } = await supabase
    .from('clips')
    .select('id,title,score,caption,output_path,status,start_ms,end_ms,ai_score,metadata')
    .eq('project_id', project)
    .eq('job_id', job)
    .eq('user_id', user.id)
    .order('rank', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  const results: ResultClip[] = [];
  for (const clip of clips || []) {
    if (!clip.output_path || clip.status === 'failed') continue;
    const { data: signed } = await supabase.storage.from('rendered-clips').createSignedUrl(clip.output_path, 3600);
    if (!signed?.signedUrl) continue;
    const seconds = Math.max(1, Math.round((Number(clip.end_ms) - Number(clip.start_ms)) / 1000));
    results.push({
      id: clip.id,
      title: clip.title,
      score: Number(clip.ai_score ?? clip.score ?? 0),
      duration: `${seconds}s`,
      reason: clip.caption || 'Clip dipilih berdasarkan relevansi mode dan skor AI.',
      preview: signed.signedUrl,
      download: signed.signedUrl,
    });
  }

  const status = String(jobRow.status ?? '');
  const engineStatus = String(jobRow.engine_status ?? '');
  const failed = status === 'failed' || engineStatus === 'FAILED';
  const errorDetails = jobRow.error_details as { message?: string } | null;
  const processing = results.length === 0 && !failed && ['queued','processing'].includes(status);

  return <main className="results-shell">
    {processing || failed ? <ResultsStatus
      projectId={project}
      jobId={job}
      initialStatus={status}
      initialEngineStatus={engineStatus}
      initialError={errorDetails?.message ?? null}
    /> : null}
    {results.length > 0 ? <ResultsView clips={results} /> : null}
    {!processing && !failed && results.length === 0 ? <ResultsView clips={[]} /> : null}
  </main>;
}
