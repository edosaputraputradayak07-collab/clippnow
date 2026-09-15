import type { JobStatus } from './types/core';

const NEXT_STATUSES: Record<JobStatus, readonly JobStatus[]> = {
  QUEUED: ['DOWNLOADING', 'TRANSCRIBING', 'FAILED'],
  DOWNLOADING: ['TRANSCRIBING', 'FAILED'],
  TRANSCRIBING: ['ANALYZING', 'FAILED'],
  ANALYZING: ['SELECTING', 'FAILED'],
  SELECTING: ['GENERATING', 'FAILED'],
  GENERATING: ['RENDERING', 'FAILED'],
  RENDERING: ['COMPLETED', 'FAILED'],
  COMPLETED: [],
  FAILED: [],
};

export function canTransitionJob(from: JobStatus, to: JobStatus): boolean {
  return NEXT_STATUSES[from].includes(to);
}
