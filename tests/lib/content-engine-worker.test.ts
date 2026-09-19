import { describe, expect, it, vi } from 'vitest';
import { runContentEngineJob, type ContentEngineWorkerDeps } from '../../src/lib/content-engine-worker';

describe('content engine worker orchestration', () => {
  it('claims, advances every stage, passes ownership to render, persists outputs, then consumes credits', async () => {
    const events: string[] = [];
    const deps: ContentEngineWorkerDeps = {
      claim: vi.fn().mockResolvedValue({ id:'j1', projectId:'p1', userId:'u1', leaseId:'lease-1', attempts:1, mode:'affiliate', inputPath:'u/p/source.mp4' }),
      stage: vi.fn(async (_id, from, to) => { events.push(`${from}->${to}`); }),
      fail: vi.fn(),
      loadSource: vi.fn().mockResolvedValue({ path:'u/p/source.mp4' }),
      transcribe: vi.fn().mockResolvedValue({ words: [], utterances: [] }),
      segment: vi.fn().mockReturnValue([{ id:'s1', startMs:0, endMs:10000, text:'hook', words:1 }]),
      score: vi.fn().mockReturnValue([{ segmentId:'s1', score:90, reasons:['hook'], startMs:0, endMs:10000, text:'hook' }]),
      generate: vi.fn().mockResolvedValue([
        { segmentId:'s1', title:'Hook', caption:'hook', hook:'hook', startMs:0, endMs:10000 },
        { segmentId:'s1', title:'CTA', caption:'cta', hook:'cta', startMs:1000, endMs:11000 },
        { segmentId:'s1', title:'Value', caption:'value', hook:'value', startMs:2000, endMs:12000 },
      ]),
      render: vi.fn()
        .mockResolvedValueOnce({ outputPath:'clips/1.mp4' })
        .mockResolvedValueOnce({ outputPath:'clips/2.mp4' })
        .mockResolvedValueOnce({ outputPath:'clips/3.mp4' }),
      persist: vi.fn(async () => {}),
      consumeCredits: vi.fn(async () => {}),
      releaseCredits: vi.fn(async () => {}),
    };
    await expect(runContentEngineJob(deps)).resolves.toBe('COMPLETED');
    expect(deps.render).toHaveBeenNthCalledWith(1, expect.anything(), expect.anything(), 'affiliate', { jobId:'j1', userId:'u1', rank:1 });
    expect(deps.persist).toHaveBeenCalledTimes(3);
    expect(deps.consumeCredits).toHaveBeenCalledOnce();
    expect(deps.fail).not.toHaveBeenCalled();
    expect(events).toEqual([
      'QUEUED->DOWNLOADING','DOWNLOADING->TRANSCRIBING','TRANSCRIBING->ANALYZING',
      'ANALYZING->SELECTING','SELECTING->GENERATING','GENERATING->RENDERING','RENDERING->COMPLETED'
    ]);
  });

  it('releases reserved credits and fails the job when rendering fails', async () => {
    const deps: ContentEngineWorkerDeps = {
      claim: vi.fn().mockResolvedValue({ id:'j2', projectId:'p2', userId:'u2', leaseId:'lease-2', attempts:1, mode:'podcast', inputPath:'u/p/source.mp4' }),
      stage: vi.fn(async () => {}),
      fail: vi.fn(async () => {}),
      loadSource: vi.fn().mockResolvedValue({ path:'u/p/source.mp4' }),
      transcribe: vi.fn().mockResolvedValue({ words: [], utterances: [] }),
      segment: vi.fn().mockReturnValue([{ id:'s1', startMs:0, endMs:10000, text:'hook', words:1 }]),
      score: vi.fn().mockReturnValue([{ segmentId:'s1', score:90, reasons:['hook'], startMs:0, endMs:10000, text:'hook' }]),
      generate: vi.fn().mockResolvedValue([
        { segmentId:'s1', title:'A', caption:'a', hook:'a', startMs:0, endMs:10000 },
        { segmentId:'s1', title:'B', caption:'b', hook:'b', startMs:1000, endMs:11000 },
        { segmentId:'s1', title:'C', caption:'c', hook:'c', startMs:2000, endMs:12000 },
      ]),
      render: vi.fn().mockRejectedValue(new Error('renderer unavailable')),
      persist: vi.fn(),
      consumeCredits: vi.fn(),
      releaseCredits: vi.fn(async () => {}),
    };
    await expect(runContentEngineJob(deps)).resolves.toBe('FAILED');
    expect(deps.fail).toHaveBeenCalledWith('j2','lease-2','renderer unavailable');
    expect(deps.releaseCredits).toHaveBeenCalledOnce();
    expect(deps.consumeCredits).not.toHaveBeenCalled();
    expect(deps.persist).not.toHaveBeenCalled();
  });

  it('still marks a job failed when credit release itself fails', async () => {
    const deps: ContentEngineWorkerDeps = {
      claim: vi.fn().mockResolvedValue({ id:'j3', projectId:'p3', userId:'u3', leaseId:'lease-3', attempts:1, mode:'seller', inputPath:'source.mp4' }),
      stage: vi.fn().mockResolvedValue(undefined),
      fail: vi.fn().mockResolvedValue(undefined),
      loadSource: vi.fn().mockRejectedValue(new Error('SOURCE_FAILED')),
      transcribe: vi.fn(),
      segment: vi.fn(),
      score: vi.fn(),
      generate: vi.fn(),
      render: vi.fn(),
      persist: vi.fn(),
      consumeCredits: vi.fn(),
      releaseCredits: vi.fn().mockRejectedValue(new Error('RELEASE_FAILED')),
    };
    await expect(runContentEngineJob(deps)).resolves.toBe('FAILED');
    expect(deps.fail).toHaveBeenCalledWith('j3', 'lease-3', expect.stringContaining('SOURCE_FAILED'));
  });

  it('does nothing when the queue is empty', async () => {
    const deps = { claim: vi.fn().mockResolvedValue(null) } as unknown as ContentEngineWorkerDeps;
    await expect(runContentEngineJob(deps)).resolves.toBe('IDLE');
  });
});