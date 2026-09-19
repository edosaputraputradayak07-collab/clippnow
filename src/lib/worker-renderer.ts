import type { ContentMode } from './types/core';
import type { RenderProvider } from './render-plan';
import { buildRenderPlan } from './render-plan';
import type { WorkerOutput, WorkerRendered, WorkerSource } from './content-engine-worker';

type RenderContext = { jobId: string; rank: number; startMs?: number; endMs?: number; userId?: string };

function safePathPart(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!normalized) throw new Error('RENDER_PATH_PART_INVALID');
  return normalized;
}

export function createWorkerRenderer(provider: RenderProvider) {
  return async (
    output: WorkerOutput,
    source: WorkerSource,
    _mode: ContentMode,
    context: RenderContext,
  ): Promise<WorkerRendered> => {
    const startMs = context.startMs ?? 0;
    const endMs = context.endMs ?? Math.min(source.durationMs ?? 60_000, startMs + 60_000);
    if (endMs <= startMs) throw new Error('RENDER_TIMING_INVALID');

    const owner = safePathPart(context.userId ?? 'worker');
    const jobId = safePathPart(context.jobId);
    if (!Number.isInteger(context.rank) || context.rank < 1 || context.rank > 5) {
      throw new Error('RENDER_RANK_INVALID');
    }

    const outputPath = `${owner}/${jobId}/clip-${context.rank}.mp4`;
    const plan = buildRenderPlan({
      clipId: output.segmentId,
      sourcePath: source.path,
      startMs,
      endMs,
      captionText: output.caption,
      outputPath,
    });
    return provider.render(plan);
  };
}
