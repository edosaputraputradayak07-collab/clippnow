import { describe, expect, it, vi } from 'vitest';
import { createWorkerRenderer } from '../../src/lib/worker-renderer';

describe('worker renderer', () => {
  it('builds a private 9:16 render plan and delegates to provider', async () => {
    const provider = { render: vi.fn().mockResolvedValue({ outputPath:'u1/job1/clip-1.mp4' }) };
    const render = createWorkerRenderer(provider);
    const result = await render(
      { segmentId:'seg-1', title:'Title', caption:'Caption', hook:'Hook' },
      { path:'https://private/source', durationMs:120000 },
      'educator',
      { jobId:'job1', rank:1, userId:'u1', startMs:1000, endMs:31000 },
    );
    expect(result.outputPath).toBe('u1/job1/clip-1.mp4');
    expect(provider.render).toHaveBeenCalledTimes(1);
    const plan = provider.render.mock.calls[0][0];
    expect(plan.width).toBe(1080);
    expect(plan.height).toBe(1920);
    expect(plan.format).toBe('mp4');
    expect(plan.caption.enabled).toBe(true);
  });

  it('rejects an invalid generated clip range', async () => {
    const provider = { render: vi.fn() };
    const render = createWorkerRenderer(provider);
    await expect(render(
      { segmentId:'seg-1', title:'Title', caption:'Caption', hook:'Hook' },
      { path:'https://private/source', durationMs:1000 },
      'affiliate',
      { jobId:'job1', rank:1, userId:'u1', startMs:2000, endMs:3000 },
    )).rejects.toThrow('RENDER_TIMING_INVALID');
  });
});
