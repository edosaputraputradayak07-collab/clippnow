import type { JobStatus } from './types/core';

export type QueueJob = {
  id: string;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  leaseUntil?: string | null;
  workerId?: string | null;
};

export type JobRepository = {
  claimNext(workerId: string, leaseSeconds: number): Promise<QueueJob | null>;
  transition(id: string, from: JobStatus, to: JobStatus): Promise<void>;
  fail(id: string, error: { code: string; message: string }): Promise<void>;
};

export const DEFAULT_LEASE_SECONDS = 300;

export async function claimNextJob(
  repository: JobRepository,
  workerId: string,
  leaseSeconds = DEFAULT_LEASE_SECONDS,
) {
  if (!workerId.trim()) throw new Error('WORKER_ID_REQUIRED');
  if (!Number.isInteger(leaseSeconds) || leaseSeconds <= 0) throw new Error('INVALID_LEASE');
  return repository.claimNext(workerId, leaseSeconds);
}

export async function processClaimedJob(
  repository: JobRepository,
  job: QueueJob,
  run: (job: QueueJob) => Promise<void>,
) {
  try {
    await run(job);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown worker error';
    await repository.fail(job.id, { code: 'WORKER_FAILED', message });
  }
}
