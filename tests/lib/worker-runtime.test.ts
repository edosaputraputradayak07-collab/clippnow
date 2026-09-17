import { describe, expect, it } from 'vitest';
import { isClaimableJob, type RuntimeJob } from '../../src/lib/worker-runtime';

describe('worker runtime lease rules', () => {
  it('allows queued jobs without a lease and jobs whose lease expired', () => {
    const now = Date.parse('2026-09-17T10:00:00.000Z');
    expect(isClaimableJob({ status: 'queued', leaseId: null, leasedUntil: null }, now)).toBe(true);
    expect(isClaimableJob({ status: 'queued', leaseId: 'lease-1', leasedUntil: Date.parse('2026-09-17T09:59:59.000Z') }, now)).toBe(true);
  });

  it('does not allow a live lease or non-queued job to be claimed', () => {
    const now = Date.parse('2026-09-17T10:00:00.000Z');
    expect(isClaimableJob({ status: 'queued', leaseId: 'lease-1', leasedUntil: Date.parse('2026-09-17T10:01:00.000Z') }, now)).toBe(false);
    expect(isClaimableJob({ status: 'processing', leaseId: null, leasedUntil: null }, now)).toBe(false);
  });
});

type _ContractCheck = RuntimeJob;
void (null as unknown as _ContractCheck);
