import { describe, expect, it } from 'vitest';
import { isAllowedWorkerStageTransition } from '../../src/lib/worker-stage';

describe('worker stage transitions', () => {
  it('accepts only the content-engine state machine transitions', () => {
    expect(isAllowedWorkerStageTransition('QUEUED', 'DOWNLOADING')).toBe(true);
    expect(isAllowedWorkerStageTransition('RENDERING', 'COMPLETED')).toBe(true);
    expect(isAllowedWorkerStageTransition('QUEUED', 'COMPLETED')).toBe(false);
    expect(isAllowedWorkerStageTransition('COMPLETED', 'RENDERING')).toBe(false);
  });
});
