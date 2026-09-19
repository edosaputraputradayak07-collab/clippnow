import type { WorkerJob, WorkerOutput, WorkerRendered } from './content-engine-worker';

type SupabaseFactory = () => {
  rpc(name: string, params: Record<string, unknown>): Promise<{ data: string | null; error: { message: string } | null }>;
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

    const durationMs = Math.round(output.endMs - output.startMs);
    const { data, error } = await createClient().rpc('persist_rendered_clip', {
      p_project_id: job.projectId,
      p_user_id: job.userId,
      p_job_id: job.id,
      p_mode: job.mode,
      p_rank: rank,
      p_start_ms: Math.round(output.startMs),
      p_end_ms: Math.round(output.endMs),
      p_title: output.title,
      p_caption: output.caption,
      p_hook: output.hook,
      p_ai_score: output.score ?? null,
      p_segment_id: output.segmentId,
      p_storage_path: rendered.outputPath,
      p_duration_ms: durationMs,
    });

    if (error || !data) {
      throw new Error('CLIP_PERSIST_FAILED:' + (error?.message ?? 'missing clip id'));
    }
  };
}
