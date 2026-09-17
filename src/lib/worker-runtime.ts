export type RuntimeJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type RuntimeJob = {
  status: RuntimeJobStatus;
  leaseId: string | null;
  leasedUntil: number | null;
};

export function isClaimableJob(job: RuntimeJob, now: number): boolean {
  if (job.status !== 'queued') return false;
  if (job.leaseId === null || job.leasedUntil === null) return true;
  return job.leasedUntil <= now;
}

export const DEFAULT_WORKER_LEASE_MS = 5 * 60_000;

export function leaseExpiry(now: number, leaseMs = DEFAULT_WORKER_LEASE_MS): number {
  if (!Number.isFinite(now) || !Number.isFinite(leaseMs) || leaseMs <= 0) {
    throw new Error('WORKER_LEASE_INVALID');
  }
  return now + leaseMs;
}
