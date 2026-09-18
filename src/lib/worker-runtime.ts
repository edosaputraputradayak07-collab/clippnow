export type RuntimeJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type RuntimeJob = {
  status: RuntimeJobStatus;
  leaseId: string | null;
  leasedUntil: number | null;
};

export const DEFAULT_WORKER_LEASE_MS = 5 * 60_000;

export function isClaimableJob(job: RuntimeJob, now: number): boolean {
  if (job.status === 'completed' || job.status === 'failed') return false;
  if (job.leaseId === null || job.leasedUntil === null) return job.status === 'queued';
  return job.leasedUntil <= now;
}

export function leaseExpiry(now: number, leaseMs = DEFAULT_WORKER_LEASE_MS): number {
  if (!Number.isFinite(now) || !Number.isFinite(leaseMs) || leaseMs <= 0 || leaseMs > 60 * 60_000) {
    throw new Error('WORKER_LEASE_INVALID');
  }
  return now + leaseMs;
}
