import { describe, expect, it, vi } from 'vitest';
import { ENGINE_PIPELINE, runWorkerOnce, validateEngineTransition } from '../../src/lib/worker';
import type { JobRepository, QueueJob } from '../../src/lib/queue';

const job: QueueJob = { id: 'job-1', status: 'QUEUED', attempts: 1, maxAttempts: 3 };

function repository(): JobRepository & { transitions: Array<[string, string, string]> } {
  const transitions: Array<[string, string, string]> = [];
  return {
    transitions,
    claimNext: vi.fn(async () => job),
    transition: vi.fn(async (id, from, to) => transitions.push([id, from, to])),
    fail: vi.fn(async () => undefined),
  };
}

describe('VidClipMoney queue worker', () => {
  it('keeps the engine pipeline ordered', () => {
    expect(ENGINE_PIPELINE).toEqual([
      'QUEUED', 'DOWNLOADING', 'TRANSCRIBING', 'ANALYZING',
      'SELECTING', 'GENERATING', 'RENDERING', 'COMPLETED',
    ]);
  });

  it('rejects skipped job states', () => {
    expect(() => validateEngineTransition('QUEUED', 'ANALYZING')).toThrow('INVALID_JOB_TRANSITION');
  });

  it('claims one job and advances every valid state', async () => {
    const repo = repository();
    const result = await runWorkerOnce(repo, 'worker-test');
    expect(result).toEqual({ claimed: true, jobId: 'job-1' });
    expect(repo.transitions).toEqual([
      ['job-1', 'QUEUED', 'DOWNLOADING'],
      ['job-1', 'DOWNLOADING', 'TRANSCRIBING'],
      ['job-1', 'TRANSCRIBING', 'ANALYZING'],
      ['job-1', 'ANALYZING', 'SELECTING'],
      ['job-1', 'SELECTING', 'GENERATING'],
      ['job-1', 'GENERATING', 'RENDERING'],
      ['job-1', 'RENDERING', 'COMPLETED'],
    ]);
  });

  it('records worker failures instead of throwing', async () => {
    const repo = repository();
    repo.claimNext = vi.fn(async () => job);
    const result = await runWorkerOnce({
      ...repo,
      transition: vi.fn(async () => { throw new Error('database unavailable'); }),
    }, 'worker-test');
    expect(result).toEqual({ claimed: true, jobId: 'job-1' });
  });
});
