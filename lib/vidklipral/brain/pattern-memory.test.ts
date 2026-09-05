import { describe, expect, it } from 'vitest';
import { createPatternMemory, learnFromFeedback, type PatternFeedback } from './pattern-memory';

describe('pattern memory', () => {
  it('starts with neutral weights', () => {
    const memory = createPatternMemory();
    expect(memory.weights.hook).toBe(0);
    expect(memory.samples).toBe(0);
  });

  it('increases a signal weight after positive feedback', () => {
    const feedback: PatternFeedback = {
      outcome: 'selected',
      signals: { hook: 0.9, pacing: 0.8, emotion: 0.7 },
    };

    const next = learnFromFeedback(createPatternMemory(), feedback);
    expect(next.samples).toBe(1);
    expect(next.weights.hook).toBeGreaterThan(0);
    expect(next.weights.pacing).toBeGreaterThan(0);
  });

  it('learns in the opposite direction from rejected candidates', () => {
    const selected = learnFromFeedback(createPatternMemory(), {
      outcome: 'selected',
      signals: { hook: 0.9 },
    });
    const rejected = learnFromFeedback(createPatternMemory(), {
      outcome: 'rejected',
      signals: { hook: 0.9 },
    });

    expect(selected.weights.hook).toBeGreaterThan(rejected.weights.hook);
  });

  it('keeps learned weights bounded', () => {
    let memory = createPatternMemory();
    for (let i = 0; i < 100; i += 1) {
      memory = learnFromFeedback(memory, { outcome: 'selected', signals: { hook: 1 } });
    }

    expect(memory.weights.hook).toBeLessThanOrEqual(1);
    expect(memory.weights.hook).toBeGreaterThanOrEqual(-1);
  });
});
