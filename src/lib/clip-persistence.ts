import type { WorkerJob, WorkerOutput, WorkerRendered } from './content-engine-worker';

type SupabaseFactory = () => {
  from(table: string): {
    insert(values: Record<string, unknown>): {
      select?: () => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> };
    } & Promise<{ data?: unknown; error: { message: string } | null }>;
  };
};

function validOutputPath(path: string): boolean {
  return path.trim().length > 0 && !path.startsWith('/') && !path.split('/').includes('..');
}

export function createSupabaseClipPersister(createClient: SupabaseFactory) {
  return async (job: WorkerJob, output: WorkerOutput, rendered: WorkerRendered, rank: number): Promise<void> => {
    if (!validOutputPath(rendered.outputPath)) throw new Error('CLIP_OUTPUT_PATH_INVALID');
    if (!Number.isInteger(rank) || rank < 1 || rank > 5) throw new Error('CLIP_RANK_INVALID');
    if (!Number.isFinite(output.startMs) || !Number.isFinite(output.endMs) || output.endMs <= output.startMs) {
      throw new Error('CLIP_TIMING_INVALID');
    }

    const client = createClient();
    const clipResult = await client.from('clips').insert({
      project_id: job.projectId,
      user_id: job.userId,
      job_id: job.id,
      mode: job.mode,
      rank,
      start_ms: Math.round(output.startMs),
      end_ms: Math.round(output.endMs),
      title: output.title,
      caption: output.caption,
      hook: output.hook,
      ai_score: null,
      metadata: { segment_id: output.segmentId },
    }).select?.().single();

    if (clipResult?.error || !clipResult?.data?.id) {
      throw new Error('CLIP_PERSIST_FAILED:' + (clipResult?.error?.message ?? 'missing clip id'));
    }

    const asset = await client.from('clip_assets').insert({
      clip_id: clipResult.data.id,
      project_id: job.projectId,
      user_id: job.userId,
      kind: 'video',
      storage_path: rendered.outputPath,
      mime_type: 'video/mp4',
      width: 1080,
      height: 1920,
      duration_ms: Math.round(output.endMs - output.startMs),
      metadata: { rank },
    });

    if (asset.error) throw new Error('CLIP_ASSET_PERSIST_FAILED:' + asset.error.message);
  };
}
