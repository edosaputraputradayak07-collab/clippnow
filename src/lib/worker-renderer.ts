import type { ContentMode } from './types/core';
import type { RenderProvider } from './render-plan';
import { buildRenderPlan } from './render-plan';
import type { WorkerOutput, WorkerRendered, WorkerSource, WorkerRenderContext } from './content-engine-worker';

type RenderContext = WorkerRenderContext;

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
    const startMs = output.startMs;
    const endMs = output.endMs;
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) throw new Error('RENDER_TIMING_REQUIRED');
    if (endMs <= startMs) throw new Error('RENDER_TIMING_INVALID');

    const owner = safePathPart(context.userId);
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
