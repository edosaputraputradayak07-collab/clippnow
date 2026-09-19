import type { JobStatus } from './types/core';
import { canTransitionJob } from './jobs';

export type QueueJob = {
  id: string;
  status: JobStatus;
  leaseId: string | null;
  leasedUntil: number | null;
  attempts: number;
};

export type JobStore = {
  claimNext: (now: number, leaseMs: number) => Promise<QueueJob | null>;
  transition: (jobId: string, from: JobStatus, to: JobStatus, leaseId: string) => Promise<void>;
  fail: (jobId: string, from: JobStatus, leaseId: string, error: string) => Promise<void>;
};

export function isLeaseValid(job: QueueJob, now: number): boolean {
  return Boolean(job.leaseId && job.leasedUntil !== null && job.leasedUntil > now);
}

export function assertTransition(from: JobStatus, to: JobStatus): void {
  if (!canTransitionJob(from, to)) {
    throw new Error(`INVALID_JOB_TRANSITION:${from}->${to}`);
  }
}

export async function runWorkerOnce(store: JobStore, now = Date.now(), leaseMs = 5 * 60_000): Promise<QueueJob | null> {
  const job = await store.claimNext(now, leaseMs);
  if (!job) return null;
  if (!isLeaseValid(job, now)) throw new Error(`INVALID_JOB_LEASE:${job.id}`);

  let current = job.status;
  const pipeline: JobStatus[] = ['DOWNLOADING', 'TRANSCRIBING', 'ANALYZING', 'SELECTING', 'GENERATING', 'RENDERING', 'COMPLETED'];

  try {
    for (const next of pipeline) {
      if (current === 'QUEUED' || current === 'DOWNLOADING' || current === 'TRANSCRIBING' || current === 'ANALYZING' || current === 'SELECTING' || current === 'GENERATING' || current === 'RENDERING') {
        if (next === current) continue;
        assertTransition(current, next);
        await store.transition(job.id, current, next, job.leaseId as string);
        current = next;
      }
    }
    return { ...job, status: current };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'WORKER_FAILED';
    await store.fail(job.id, current, job.leaseId as string, message);
    return { ...job, status: 'FAILED' };
  }
}
