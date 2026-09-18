import { describe, expect, it } from 'vitest';
import { nextRetryDelayMs, shouldRetryWorker } from '../../src/lib/worker-recovery';

describe('worker recovery policy', () => {
  it('retries transient failures below the attempt limit', () => {
    expect(shouldRetryWorker(1, 3, 'TRANSIENT')).toBe(true);
    expect(shouldRetryWorker(3, 3, 'TRANSIENT')).toBe(false);
  });

  it('never retries permanent failures', () => {
    expect(shouldRetryWorker(1, 3, 'PERMANENT')).toBe(false);
  });

  it('uses bounded exponential backoff', () => {
    expect(nextRetryDelayMs(1)).toBe(1000);
    expect(nextRetryDelayMs(2)).toBe(2000);
    expect(nextRetryDelayMs(10)).toBe(30000);
  });
});
