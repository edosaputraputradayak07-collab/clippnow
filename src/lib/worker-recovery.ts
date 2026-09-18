export type WorkerFailureKind = 'TRANSIENT' | 'PERMANENT';

const MAX_BACKOFF_MS = 30_000;

export function shouldRetryWorker(
  attempts: number,
  maxAttempts: number,
  kind: WorkerFailureKind,
): boolean {
  if (!Number.isInteger(attempts) || attempts < 1) return false;
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) return false;
  return kind === 'TRANSIENT' && attempts < maxAttempts;
}

export function nextRetryDelayMs(attempts: number): number {
  if (!Number.isInteger(attempts) || attempts < 1) {
    throw new Error('WORKER_ATTEMPT_INVALID');
  }
  return Math.min(1000 * 2 ** (attempts - 1), MAX_BACKOFF_MS);
}
