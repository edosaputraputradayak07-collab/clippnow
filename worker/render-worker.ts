import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createAdminClient } from '@/lib/supabase/admin';
import { renderClip } from '@/lib/rendering/renderer';
import { downloadPrivateVideo, uploadPrivateVideo } from './storage';
import { buildAssSubtitles, type SubtitleWord } from '@/lib/ai/ass-subtitles';

const workerId = process.env.WORKER_ID ?? `worker-${process.pid}`;
async function claim(jobId: string) { const admin = createAdminClient(); const { data, error } = await admin.rpc('claim_clippnow_job', { p_job_id: jobId, p_worker_id: workerId, p_lease_seconds: 900 }); if (error) throw error; return data; }
async function isCurrentWorker(admin: ReturnType<typeof createAdminClient>, jobId: string) {
  const { data, error } = await admin.from('jobs').select('id,status,worker_id,lease_expires_at').eq('id', jobId).maybeSingle();
  if (error) throw error;
  return !!data && data.status === 'processing' && data.worker_id === workerId && (!data.lease_expires_at || new Date(data.lease_expires_at).getTime() > Date.now());
}

type EditPlan = { effects?: string[]; subtitle?: { style?: 'viral-punch' | 'clean' | 'karaoke' | 'neon' | 'cinematic' }; words?: SubtitleWord[] };

export async function processJob(jobId: string) {
  const job = await claim(jobId); if (!job) throw new Error('job_not_claimed');
  const admin = createAdminClient();
  const { data: project, error } = await admin.from('projects').select('id,user_id,start_seconds,end_seconds,format,source_path,edit_mode,edit_plan,credit_reference').eq('id', job.project_id).single();
  if (error || !project || project.user_id !== job.user_id || project.source_path !== job.source_path || !project.credit_reference) throw new Error('job_source_mismatch');

  const tmp = await mkdtemp(path.join(os.tmpdir(), 'clippnow-'));
  const input = path.join(tmp, 'source');
  const output = path.join(tmp, 'render.mp4');
  try {
    await downloadPrivateVideo(project.source_path, input);
    const editPlan = (project.edit_plan ?? {}) as EditPlan;
    const words = Array.isArray(editPlan.words) ? editPlan.words : [];
    const subtitlePath = project.edit_mode === 'viral' && words.length ? path.join(tmp, 'captions.ass') : undefined;
    if (subtitlePath) await writeFile(subtitlePath, buildAssSubtitles(words, editPlan.subtitle?.style), 'utf8');

    await renderClip({
      sourcePath: input,
      outputPath: output,
      startSeconds: Number(project.start_seconds),
      durationSeconds: Number(project.end_seconds) - Number(project.start_seconds),
      format: project.format,
      subtitlePath,
      effects: project.edit_mode === 'viral' ? editPlan.effects : [],
    }, async p => {
      if (!(await isCurrentWorker(admin, job.id))) throw new Error('job_lease_lost');
      await admin.from('jobs').update({ progress: p.percent, last_heartbeat_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', job.id).eq('worker_id', workerId).eq('status', 'processing');
    });

    if (!(await isCurrentWorker(admin, job.id))) throw new Error('job_lease_lost');
    const outputPath = `${project.user_id}/rendered/${project.id}.mp4`;
    await uploadPrivateVideo(output, outputPath);
    if (!(await isCurrentWorker(admin, job.id))) throw new Error('job_lease_lost');
    const { data: finalized, error: finalizeError } = await admin.rpc('finalize_clippnow_job', { p_job_id: job.id, p_worker_id: workerId, p_status: 'completed', p_progress: 100, p_output_path: outputPath });
    if (finalizeError || !finalized) throw finalizeError ?? new Error('job_finalize_rejected');
    await admin.from('projects').update({ status: 'completed', output_path: outputPath, updated_at: new Date().toISOString() }).eq('id', project.id).eq('user_id', project.user_id);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'render_failed';
    const current = await isCurrentWorker(admin, job.id).catch(() => false);
    if (current) {
      const { data: finalized, error: finalizeError } = await admin.rpc('finalize_clippnow_job', { p_job_id: job.id, p_worker_id: workerId, p_status: 'failed', p_progress: Number(job.progress ?? 0), p_error_code: 'RENDER_FAILED', p_error_message: message });
      if (!finalizeError && finalized) {
        await admin.from('projects').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', project.id).eq('user_id', project.user_id);
        await admin.rpc('release_clippnow_credit', { p_user_id: project.user_id, p_reference: project.credit_reference });
      }
    }
    throw error;
  } finally { await rm(tmp, { recursive: true, force: true }); }
}

if (process.argv[1]?.endsWith('render-worker.ts')) { const jobId = process.argv[2]; if (!jobId) throw new Error('Usage: node worker/render-worker.ts <job-id>'); processJob(jobId).catch(() => process.exit(1)); }
