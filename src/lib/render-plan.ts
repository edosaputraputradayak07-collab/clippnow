export type RenderPlanInput = { clipId: string; sourcePath: string; startMs: number; endMs: number; captionText: string; outputPath: string };
export type RenderPlan = RenderPlanInput & { width: 1080; height: 1920; reframe: 'auto-center'; caption: { enabled: boolean; text: string; style: 'indonesian-bold' }; format: 'mp4'; videoCodec: 'h264'; audioCodec: 'aac' };

export function buildRenderPlan(input: RenderPlanInput): RenderPlan {
  if (!input.clipId.trim() || !input.sourcePath.trim()) throw new Error('RENDER_INPUT_INVALID');
  if (!Number.isFinite(input.startMs) || !Number.isFinite(input.endMs) || input.startMs < 0 || input.endMs <= input.startMs) throw new Error('RENDER_TIMING_INVALID');
  if (!input.outputPath.trim() || input.outputPath.startsWith('/') || input.outputPath.split('/').includes('..')) throw new Error('RENDER_OUTPUT_PATH_INVALID');
  const captionText = input.captionText.replace(/\s+/g, ' ').trim();
  return { ...input, captionText, width: 1080, height: 1920, reframe: 'auto-center', caption: { enabled: captionText.length > 0, text: captionText, style: 'indonesian-bold' }, format: 'mp4', videoCodec: 'h264', audioCodec: 'aac' };
}

export interface RenderProvider { render(plan: RenderPlan): Promise<{ outputPath: string }> }
export function createDeterministicRenderProvider(): RenderProvider {
  return { render: async (plan) => ({ outputPath: plan.outputPath }) };
}
