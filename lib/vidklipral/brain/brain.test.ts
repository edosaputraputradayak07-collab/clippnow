import { describe, expect, it } from 'vitest';
import { createPatternMemory, learnFromFeedback } from './pattern-memory';
import { decideBestClips, type BrainCandidate } from './brain';
import type { ClipSignals } from './scoring';

function signals(overrides: Partial<ClipSignals> = {}): ClipSignals {
  return {
    hook: 0.5,
    curiosity: 0.5,
    emotion: 0.5,
    storyCompleteness: 0.5,
    informationValue: 0.5,
    surprise: 0.5,
    humor: 0.5,
    speakerEnergy: 0.5,
    visualInterest: 0.5,
    pacing: 0.5,
    rewatchPotential: 0.5,
    deadAir: 0.05,
    ...overrides,
  };
}

describe('Vidklipral brain facade', () => {
  it('ranks complete candidates and keeps the input immutable', () => {
    const candidates: BrainCandidate[] = [
      { id: 'a', startSeconds: 0, endSeconds: 30, signals: signals({ hook: 0.9, curiosity: 0.8, emotion: 0.7, storyCompleteness: 0.9, informationValue: 0.6, surprise: 0.7, humor: 0.2, speakerEnergy: 0.8, visualInterest: 0.7, pacing: 0.8, rewatchPotential: 0.8, deadAir: 0.01 }) },
      { id: 'b', startSeconds: 40, endSeconds: 70, signals: signals({ deadAir: 0.1 }) },
    ];

    const result = decideBestClips(candidates, 2, createPatternMemory());

    expect(result.map((item) => item.id)).toEqual(['a', 'b']);
    expect(result[0].score).toBeGreaterThan(result[1].score);
    expect(candidates.map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('uses learned memory as a bounded ranking bias', () => {
    const memory = learnFromFeedback(createPatternMemory(), {
      outcome: 'selected',
      signals: { hook: 1, curiosity: 1 },
    });

    const candidates: BrainCandidate[] = [
      { id: 'hook', startSeconds: 0, endSeconds: 20, signals: signals({ hook: 1 }) },
      { id: 'flat', startSeconds: 30, endSeconds: 50, signals: signals({ hook: 0.8 }) },
    ];

    const result = decideBestClips(candidates, 2, memory);
    expect(result[0].id).toBe('hook');
    expect(result[0].score).toBeLessThanOrEqual(1);
    expect(result[0].score).toBeGreaterThanOrEqual(0);
  });
});
