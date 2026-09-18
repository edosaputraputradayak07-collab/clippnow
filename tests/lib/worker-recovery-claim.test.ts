import { describe, expect, it } from 'vitest';
import { isClaimableJob } from '../../src/lib/worker-runtime';

describe('worker recovery claim semantics', () => {
  it('reclaims an expired processing lease', () => {
    expect(isClaimableJob({ status:'processing', leaseId:'l1', leasedUntil:900 }, 1000)).toBe(true);
  });
  it('does not claim an active processing lease', () => {
    expect(isClaimableJob({ status:'processing', leaseId:'l1', leasedUntil:1100 }, 1000)).toBe(false);
  });
  it('claims queued jobs without a lease', () => {
    expect(isClaimableJob({ status:'queued', leaseId:null, leasedUntil:null }, 1000)).toBe(true);
  });
});