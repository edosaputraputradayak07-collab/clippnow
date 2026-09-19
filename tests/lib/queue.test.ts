import { describe, expect, it, vi } from 'vitest';
import { isLeaseValid, runWorkerOnce, type JobStore } from '../../src/lib/queue';

describe('queue worker contract', () => {
  it('accepts only an unexpired lease', () => {
    const job = { id: 'j1', status: 'QUEUED' as const, leaseId: 'lease-1', leasedUntil: 1100, attempts: 1 };
    expect(isLeaseValid(job, 1000)).toBe(true);
    expect(isLeaseValid(job, 1100)).toBe(false);
  });

  it('runs the ordered processing pipeline to completion', async () => {
    const transitions: string[] = [];
    const store: JobStore = {
      claimNext: vi.fn(async () => ({ id: 'j1', status: 'QUEUED' as const, leaseId: 'lease-1', leasedUntil: 2000, attempts: 1 })),
      transition: vi.fn(async (_id, from, to) => { transitions.push(`${from}->${to}`); }),
      fail: vi.fn(async () => undefined),
    };

    const result = await runWorkerOnce(store, 1000, 500);
    expect(result?.status).toBe('COMPLETED');
    expect(transitions).toEqual([
      'QUEUED->DOWNLOADING',
      'DOWNLOADING->TRANSCRIBING',
      'TRANSCRIBING->ANALYZING',
      'ANALYZING->SELECTING',
      'SELECTING->GENERATING',
      'GENERATING->RENDERING',
      'RENDERING->COMPLETED',
    ]);
    expect(store.fail).not.toHaveBeenCalled();
  });

  it('records a worker failure and terminates the job', async () => {
    const store: JobStore = {
      claimNext: vi.fn(async () => ({ id: 'j2', status: 'QUEUED' as const, leaseId: 'lease-2', leasedUntil: 2000, attempts: 1 })),
      transition: vi.fn(async (_id, from, to) => {
        if (from === 'TRANSCRIBING' && to === 'ANALYZING') throw new Error('TRANSCRIBER_UNAVAILABLE');
      }),
      fail: vi.fn(async () => undefined),
    };

    const result = await runWorkerOnce(store, 1000, 500);
    expect(result?.status).toBe('FAILED');
    expect(store.fail).toHaveBeenCalledWith('j2', 'TRANSCRIBING', 'lease-2', 'TRANSCRIBER_UNAVAILABLE');
  });

  it('returns no job when the queue is empty', async () => {
    const store: JobStore = {
      claimNext: vi.fn(async () => null),
      transition: vi.fn(async () => undefined),
      fail: vi.fn(async () => undefined),
    };
    expect(await runWorkerOnce(store)).toBeNull();
  });
});
