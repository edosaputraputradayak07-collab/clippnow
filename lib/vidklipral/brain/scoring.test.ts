import { describe, expect, it } from 'vitest';
import { scoreClipCandidate, scoreClipCandidateDetailed, rankClipCandidates } from './scoring';

describe('scoreClipCandidate', () => {
  it('weights hook, story completeness, emotion, visual interest and pacing into a bounded viral score', () => {
    const score = scoreClipCandidate({
      hook: 0.9, curiosity: 0.8, emotion: 0.7, storyCompleteness: 0.9,
      informationValue: 0.6, surprise: 0.8, humor: 0.4, speakerEnergy: 0.8,
      visualInterest: 0.7, pacing: 0.9, rewatchPotential: 0.8, deadAir: 0.1,
    });

    expect(score).toBeGreaterThan(0.7);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('penalizes dead air instead of treating every strong signal equally', () => {
    const strong = scoreClipCandidate({
      hook: 0.9, curiosity: 0.9, emotion: 0.8, storyCompleteness: 0.9,
      informationValue: 0.8, surprise: 0.8, humor: 0.5, speakerEnergy: 0.9,
      visualInterest: 0.8, pacing: 0.9, rewatchPotential: 0.8, deadAir: 0,
    });
    const slow = scoreClipCandidate({
      hook: 0.9, curiosity: 0.9, emotion: 0.8, storyCompleteness: 0.9,
      informationValue: 0.8, surprise: 0.8, humor: 0.5, speakerEnergy: 0.9,
      visualInterest: 0.8, pacing: 0.9, rewatchPotential: 0.8, deadAir: 0.8,
    });

    expect(slow).toBeLessThan(strong);
  });

  it('keeps the legacy numeric score API stable for old callers', () => {
    expect(typeof scoreClipCandidate({
      hook: 0.8, curiosity: 0.8, emotion: 0.8, storyCompleteness: 0.8,
      informationValue: 0.8, surprise: 0.8, humor: 0.8, speakerEnergy: 0.8,
      visualInterest: 0.8, pacing: 0.8, rewatchPotential: 0.8, deadAir: 0,
    })).toBe('number');
  });

  it('includes standalone context and payoff in the detailed score breakdown', () => {
    const result = scoreClipCandidateDetailed({
      hook: 1, curiosity: 1, emotion: 0.5, storyCompleteness: 1,
      informationValue: 0.7, surprise: 0.8, humor: 0.2, speakerEnergy: 0.8,
      visualInterest: 0.7, pacing: 0.8, rewatchPotential: 0.9, deadAir: 0,
      standaloneContext: 1, payoff: 1, captionDensity: 0.6, topicRelevance: 0.9, duplicatePenalty: 0,
    });

    expect(result.score).toBeGreaterThan(0.7);
    expect(result.breakdown.standaloneContext).toBe(1);
    expect(result.breakdown.payoff).toBe(1);
  });
});

describe('rankClipCandidates', () => {
  it('returns candidates from highest to lowest score without mutating the input', () => {
    const candidates = [
      { id: 'low', score: 0.4 },
      { id: 'high', score: 0.9 },
      { id: 'mid', score: 0.7 },
    ];

    const ranked = rankClipCandidates(candidates);

    expect(ranked.map((candidate) => candidate.id)).toEqual(['high', 'mid', 'low']);
    expect(candidates.map((candidate) => candidate.id)).toEqual(['low', 'high', 'mid']);
  });
});
