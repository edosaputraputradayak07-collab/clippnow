import { describe, expect, it, vi } from 'vitest';
import { runContentEngineJob, type ContentEngineWorkerDeps } from '../../src/lib/content-engine-worker';

describe('content engine worker heartbeat integration', () => {
  it('renews the lease while a long pipeline operation is running', async () => {
    vi.useFakeTimers();
    let release!: () => void;
    const render = vi.fn().mockImplementation(
      () => new Promise((resolve) => { release = () => resolve({ outputPath: 'clip.mp4' }); }),
    );
    const renew = vi.fn().mockResolvedValue(Date.now() + 300000);

    const deps: ContentEngineWorkerDeps = {
      claim: vi.fn().mockResolvedValue({
        id:'j1', projectId:'p1', leaseId:'l1', attempts:1, mode:'affiliate', inputPath:'source.mp4',
      }),
      renew,
      stage: vi.fn().mockResolvedValue(undefined),
      fail: vi.fn().mockResolvedValue(undefined),
      loadSource: vi.fn().mockResolvedValue({path:'source.mp4', durationMs:60000}),
      transcribe: vi.fn().mockResolvedValue({words:[], utterances:[]}),
      segment: vi.fn().mockReturnValue([{id:'s1',startMs:0,endMs:10000,text:'hook',words:1}]),
      score: vi.fn().mockReturnValue([{segmentId:'s1',score:90,reasons:[],startMs:0,endMs:10000,text:'hook'}]),
      generate: vi.fn().mockResolvedValue([
        {segmentId:'s1',title:'A',caption:'a',hook:'a'},
        {segmentId:'s1',title:'B',caption:'b',hook:'b'},
        {segmentId:'s1',title:'C',caption:'c',hook:'c'},
      ]),
      render,
      persist: vi.fn().mockResolvedValue(undefined),
      consumeCredits: vi.fn().mockResolvedValue(undefined),
      releaseCredits: vi.fn().mockResolvedValue(undefined),
      heartbeatIntervalMs: 1000,
    };

    const running = runContentEngineJob(deps);
    await vi.advanceTimersByTimeAsync(1000);
    expect(renew).toHaveBeenCalledWith('j1', 'l1');

    release();
    release();
    release();
    await expect(running).resolves.toBe('COMPLETED');
    vi.useRealTimers();
  });
});
