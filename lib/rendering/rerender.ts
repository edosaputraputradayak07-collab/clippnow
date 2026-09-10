export type RerenderableJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export function canRerenderCompletedJob(status: RerenderableJobStatus): boolean {
  return status === 'completed';
}
