import { canTransitionJob } from './jobs';
import type { JobStatus } from './types/core';

export function isAllowedWorkerStageTransition(from: JobStatus, to: JobStatus): boolean {
  return canTransitionJob(from, to);
}
