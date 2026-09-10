import { describe, expect, it } from 'vitest';
import { canRerenderCompletedJob } from './rerender';

describe('canRerenderCompletedJob', () => {
  it('allows a completed job to be rendered again', () => {
    expect(canRerenderCompletedJob('completed')).toBe(true);
  });

  it('does not treat queued or processing jobs as rerunnable', () => {
    expect(canRerenderCompletedJob('queued')).toBe(false);
    expect(canRerenderCompletedJob('processing')).toBe(false);
  });

  it('does not rerun a failed job through the completed-job path', () => {
    expect(canRerenderCompletedJob('failed')).toBe(false);
  });
});
