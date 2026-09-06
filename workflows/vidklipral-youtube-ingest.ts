import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ffmpegPath from 'ffmpeg-static';
import youtubedl from 'youtube-dl-exec';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildYouTubeIngestionArgs, validateYouTubeIngestionRequest } from '@/lib/vidklipral/ingest/youtube-ingestion';

const BUCKET = 'clippnow-videos';

type YouTubeIngestInput = {
  projectId: string;
  jobId: string;
  userId: string;
  url: string;
};

type YouTubeIngestResult = {
  sourcePath: string;
  videoId: string;
};

function parseInput(raw: YouTubeIngestInput): YouTubeIngestInput {
  if (!raw.projectId || !raw.jobId || !raw.userId || !raw.url) {
    throw new Error('YouTube ingestion input is incomplete.');
  }
  return raw;
}

async function ingestYouTubeSource(input: YouTubeIngestInput): Promise<YouTubeIngestResult> {
  'use step';
  const admin = createAdminClient();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vidklipral-youtube-'));
  const outputFile = path.join(tempDir, 'source.mp4');
  const sourcePath = `${input.userId}/sources/${input.projectId}.mp4`;
  const request = validateYouTubeIngestionRequest({ url: input.url, outputPath: outputFile });
  const workerId = `vidklipral-youtube-${input.jobId}`;

  try {
    const { error: claimError } = await admin.rpc('claim_clippnow_job', {
      p_job_id: input.jobId,
      p_worker_id: workerId,
      p_lease_seconds: 1800,
    });
    if (claimError) throw new Error(`Job claim failed: ${claimError.message}`);

    await admin.from('jobs').update({ progress: 10, last_heartbeat_at: new Date().toISOString() }).eq('id', input.jobId).eq('user_id', input.userId);

    const args = buildYouTubeIngestionArgs(request).slice(0, -1);
    const subprocess = youtubedl.exec(request.url, {
      noPlaylist: true,
      noProgress: true,
      restrictFilenames: true,
      format: args[4],
      mergeOutputFormat: 'mp4',
      output: outputFile,
      ...(ffmpegPath ? { ffmpegLocation: path.dirname(ffmpegPath) } : {}),
    });
    await subprocess;

    await admin.from('jobs').update({ progress: 70, last_heartbeat_at: new Date().toISOString() }).eq('id', input.jobId).eq('user_id', input.userId);

    const outputBuffer = await fs.readFile(outputFile);
    const { error: uploadError } = await admin.storage.from(BUCKET).upload(sourcePath, outputBuffer, {
      contentType: 'video/mp4',
      cacheControl: '3600',
      upsert: true,
    });
    if (uploadError) throw new Error(`YouTube source upload failed: ${uploadError.message}`);

    const { error: projectError } = await admin.from('projects').update({ source_path: sourcePath, status: 'ready' }).eq('id', input.projectId).eq('user_id', input.userId);
    if (projectError) throw new Error(`Project source update failed: ${projectError.message}`);

    const { error: finalizeError } = await admin.rpc('finalize_clippnow_job', {
      p_job_id: input.jobId,
      p_worker_id: workerId,
      p_status: 'completed',
      p_progress: 100,
      p_output_path: sourcePath,
    });
    if (finalizeError) throw new Error(`Job finalize failed: ${finalizeError.message}`);

    return { sourcePath, videoId: request.videoId };
  } catch (error) {
    await admin.rpc('finalize_clippnow_job', {
      p_job_id: input.jobId,
      p_worker_id: workerId,
      p_status: 'failed',
      p_progress: 0,
      p_error_code: 'YOUTUBE_INGEST_FAILED',
      p_error_message: error instanceof Error ? error.message : 'YouTube ingestion failed',
    });
    await admin.from('projects').update({ status: 'failed' }).eq('id', input.projectId).eq('user_id', input.userId);
    throw error;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

export async function vidklipralYouTubeIngestWorkflow(rawInput: YouTubeIngestInput): Promise<YouTubeIngestResult> {
  'use workflow';
  return ingestYouTubeSource(parseInput(rawInput));
}
