import { describe, expect, it, vi } from 'vitest';
import { withWorkerLeaseHeartbeat } from '../../src/lib/worker-heartbeat';

describe('worker lease heartbeat', () => {
  it('renews before the operation completes when the interval elapses', async () => {
    vi.useFakeTimers();
    const renew = vi.fn().mockResolvedValue(123);
    let release!: () => void;
    const operation = new Promise<string>((resolve) => {
      release = () => resolve('done');
    });

    const running = withWorkerLeaseHeartbeat(operation, renew, { intervalMs: 1000 });
    await vi.advanceTimersByTimeAsync(1000);
    expect(renew).toHaveBeenCalledTimes(1);

    release();
    await expect(running).resolves.toBe('done');
    vi.useRealTimers();
  });

  it('fails the operation if a heartbeat fails', async () => {
    vi.useFakeTimers();
    const renew = vi.fn().mockRejectedValue(new Error('heartbeat down'));
    const operation = new Promise<string>(() => {});

    const running = withWorkerLeaseHeartbeat(operation, renew, { intervalMs: 1000 });
    const rejection = expect(running).rejects.toThrow('heartbeat down');
    await vi.advanceTimersByTimeAsync(1000);
    await rejection;
    vi.useRealTimers();
  });

  it('rejects invalid intervals', async () => {
    await expect(
      withWorkerLeaseHeartbeat(Promise.resolve('ok'), vi.fn(), { intervalMs: 0 }),
    ).rejects.toThrow('WORKER_HEARTBEAT_INTERVAL_INVALID');
  });
});
