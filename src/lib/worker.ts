import { canTransitionJob } from './jobs';
import type { JobStatus } from './types/core';
import { claimNextJob, processClaimedJob, type JobRepository, type QueueJob } from './queue';

export type EngineStep = {
  from: JobStatus;
  to: JobStatus;
  run: (job: QueueJob) => Promise<void>;
};

export const ENGINE_PIPELINE: readonly JobStatus[] = [
  'QUEUED',
  'DOWNLOADING',
  'TRANSCRIBING',
  'ANALYZING',
  'SELECTING',
  'GENERATING',
  'RENDERING',
  'COMPLETED',
];

export function validateEngineTransition(from: JobStatus, to: JobStatus) {
  if (!canTransitionJob(from, to)) {
    throw new Error(`INVALID_JOB_TRANSITION:${from}->${to}`);
  }
}

export async function runWorkerOnce(repository: JobRepository, workerId: string) {
  const job = await claimNextJob(repository, workerId);
  if (!job) return { claimed: false as const };

  await processClaimedJob(repository, job, async (claimed) => {
    let current = claimed.status;
    for (const next of ENGINE_PIPELINE.slice(1)) {
      validateEngineTransition(current, next);
      await repository.transition(claimed.id, current, next);
      current = next;
    }
  });

  return { claimed: true as const, jobId: job.id };
}
