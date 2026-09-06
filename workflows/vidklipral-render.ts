import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import ffmpegPath from 'ffmpeg-static';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildRenderPlan } from '@/lib/vidklipral/engine/render-plan';
import { parseVideoWorkflowInput, type VideoWorkflowInput } from '@/lib/vidklipral/pipeline/workflow-contract';

const execFileAsync = promisify(execFile);
const BUCKET = 'clippnow-videos';

type RenderResult = { outputPath: string };

async function claimRenderJob(input: VideoWorkflowInput): Promise<void> {
  'use step';
  const admin = createAdminClient();
  const workerId = `vidklipral-${input.jobId}`;
  const { error } = await admin.rpc('claim_clippnow_job', {
    p_job_id: input.jobId,
    p_worker_id: workerId,
    p_lease_seconds: 1800,
  });
  if (error) throw new Error(`Job claim failed: ${error.message}`);
}

async function renderNativeClip(input: VideoWorkflowInput): Promise<RenderResult> {
  'use step';
  if (!ffmpegPath) throw new Error('FFmpeg binary is unavailable.');

  const admin = createAdminClient();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vidklipral-'));
  const sourceFile = path.join(tempDir, 'source.mp4');
  const outputFile = path.join(tempDir, 'clip.mp4');
  const outputPath = `${input.userId}/renders/${input.projectId}.mp4`;

  try {
    await admin.from('jobs').update({ progress: 15, last_heartbeat_at: new Date().toISOString() }).eq('id', input.jobId).eq('user_id', input.userId);

    const { data, error } = await admin.storage.from(BUCKET).download(input.sourcePath);
    if (error || !data) throw new Error(`Source download failed: ${error?.message ?? 'empty source'}`);
    await fs.writeFile(sourceFile, Buffer.from(await data.arrayBuffer()));

    const plan = buildRenderPlan({
      inputPath: sourceFile,
      outputPath: outputFile,
      startSeconds: input.startSeconds,
      endSeconds: input.endSeconds,
      aspectRatio: input.format,
    });

    await admin.from('jobs').update({ progress: 35, last_heartbeat_at: new Date().toISOString() }).eq('id', input.jobId).eq('user_id', input.userId);
    await execFileAsync(ffmpegPath, plan.args, { maxBuffer: 1024 * 1024 * 4 });

    const outputBuffer = await fs.readFile(outputFile);
    const { error: uploadError } = await admin.storage.from(BUCKET).upload(outputPath, outputBuffer, {
      contentType: 'video/mp4',
      cacheControl: '3600',
      upsert: true,
    });
    if (uploadError) throw new Error(`Rendered clip upload failed: ${uploadError.message}`);

    const workerId = `vidklipral-${input.jobId}`;
    const { error: finalizeError } = await admin.rpc('finalize_clippnow_job', {
      p_job_id: input.jobId,
      p_worker_id: workerId,
      p_status: 'completed',
      p_progress: 100,
      p_output_path: outputPath,
    });
    if (finalizeError) throw new Error(`Job finalize failed: ${finalizeError.message}`);

    await admin.from('projects').update({ status: 'completed' }).eq('id', input.projectId).eq('user_id', input.userId);
    return { outputPath };
  } catch (error) {
    const adminForFailure = createAdminClient();
    await adminForFailure.rpc('finalize_clippnow_job', {
      p_job_id: input.jobId,
      p_worker_id: `vidklipral-${input.jobId}`,
      p_status: 'failed',
      p_progress: 0,
      p_error_code: 'NATIVE_RENDER_FAILED',
      p_error_message: error instanceof Error ? error.message : 'Native render failed',
    });
    await adminForFailure.from('projects').update({ status: 'failed' }).eq('id', input.projectId).eq('user_id', input.userId);
    throw error;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

export async function vidklipralRenderWorkflow(rawInput: VideoWorkflowInput): Promise<RenderResult> {
  'use workflow';
  const input = parseVideoWorkflowInput(rawInput);
  await claimRenderJob(input);
  return renderNativeClip(input);
}
