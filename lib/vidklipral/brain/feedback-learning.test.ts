import { describe, expect, it } from 'vitest';
import { createPatternMemory } from './pattern-memory';
import { learnFromClipOutcomes, type ClipOutcome } from './feedback-learning';

describe('feedback learning', () => {
  it('learns from selected and rejected outcomes in one pass', () => {
    const outcomes: ClipOutcome[] = [
      { outcome: 'selected', signals: { hook: 0.9, pacing: 0.8 } },
      { outcome: 'rejected', signals: { hook: 0.2, pacing: 0.3 } },
    ];

    const next = learnFromClipOutcomes(createPatternMemory(), outcomes);

    expect(next.samples).toBe(2);
    expect(next.weights.hook).toBeGreaterThan(0);
    expect(next.weights.pacing).toBeGreaterThan(0);
  });

  it('does not mutate the previous memory', () => {
    const initial = createPatternMemory();
    const next = learnFromClipOutcomes(initial, [
      { outcome: 'selected', signals: { hook: 1 } },
    ]);

    expect(initial.samples).toBe(0);
    expect(initial.weights.hook).toBe(0);
    expect(next).not.toBe(initial);
  });
});
