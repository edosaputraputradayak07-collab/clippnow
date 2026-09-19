import { describe, expect, it } from 'vitest';
import { buildRenderPlan } from '../../src/lib/render-plan';

describe('render plan', () => {
  it('creates a 9:16 plan with captions and source timing', () => {
    const plan = buildRenderPlan({ clipId: 'clip-1', sourcePath: 'u/p/source.mp4', startMs: 1200, endMs: 37200, captionText: 'Ini contoh caption.', outputPath: 'u/p/clip-1.mp4' });
    expect(plan.width / plan.height).toBeCloseTo(9 / 16);
    expect(plan.startMs).toBe(1200);
    expect(plan.endMs).toBe(37200);
    expect(plan.caption.enabled).toBe(true);
    expect(plan.reframe).toBe('auto-center');
    expect(plan.outputPath).toBe('u/p/clip-1.mp4');
  });

  it('rejects invalid timing and unsafe output paths', () => {
    expect(() => buildRenderPlan({ clipId: 'x', sourcePath: 'a', startMs: 10, endMs: 10, captionText: 'x', outputPath: 'x' })).toThrow('RENDER_TIMING_INVALID');
    expect(() => buildRenderPlan({ clipId: 'x', sourcePath: 'a', startMs: 0, endMs: 1000, captionText: 'x', outputPath: '../x' })).toThrow('RENDER_OUTPUT_PATH_INVALID');
  });
});
