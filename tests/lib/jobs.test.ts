import { describe, expect, it } from 'vitest';
import { canTransitionJob } from '../../src/lib/jobs';

describe('job lifecycle', () => {
  it('allows the happy-path transitions', () => {
    expect(canTransitionJob('QUEUED', 'DOWNLOADING')).toBe(true);
    expect(canTransitionJob('DOWNLOADING', 'TRANSCRIBING')).toBe(true);
    expect(canTransitionJob('TRANSCRIBING', 'ANALYZING')).toBe(true);
    expect(canTransitionJob('ANALYZING', 'SELECTING')).toBe(true);
    expect(canTransitionJob('SELECTING', 'GENERATING')).toBe(true);
    expect(canTransitionJob('GENERATING', 'RENDERING')).toBe(true);
    expect(canTransitionJob('RENDERING', 'COMPLETED')).toBe(true);
  });

  it('allows failure from every non-terminal processing state', () => {
    for (const state of ['QUEUED', 'DOWNLOADING', 'TRANSCRIBING', 'ANALYZING', 'SELECTING', 'GENERATING', 'RENDERING'] as const) {
      expect(canTransitionJob(state, 'FAILED')).toBe(true);
    }
  });

  it('rejects skipping stages and leaving terminal states', () => {
    expect(canTransitionJob('QUEUED', 'ANALYZING')).toBe(false);
    expect(canTransitionJob('COMPLETED', 'QUEUED')).toBe(false);
    expect(canTransitionJob('FAILED', 'QUEUED')).toBe(false);
  });
});
