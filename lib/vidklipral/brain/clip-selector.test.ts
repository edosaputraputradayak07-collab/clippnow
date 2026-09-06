import { describe, expect, it } from 'vitest';
import { selectClipCandidates, type ClipCandidate } from './clip-selector';

function candidate(overrides: Partial<ClipCandidate> = {}): ClipCandidate {
  return {
    id: 'clip-1',
    startSeconds: 0,
    endSeconds: 30,
    score: 0.8,
    context: {
      transcript: 'Strong hook with a complete story.',
      durationSeconds: 30,
      sceneChangeRate: 0.2,
      silenceRatio: 0.02,
      speakerChangeRate: 0.03,
    },
    ...overrides,
  };
}

describe('selectClipCandidates', () => {
  it('ranks candidates by score and preserves the input array', () => {
    const input = [
      candidate({ id: 'low', startSeconds: 35, endSeconds: 65, score: 0.6 }),
      candidate({ id: 'high', score: 0.95 }),
    ];
    const result = selectClipCandidates(input, 2);

    expect(result.map((item) => item.id)).toEqual(['high', 'low']);
    expect(input.map((item) => item.id)).toEqual(['low', 'high']);
  });

  it('filters candidates below the minimum score', () => {
    const input = [candidate({ id: 'strong', score: 0.82 }), candidate({ id: 'weak', score: 0.59 })];

    expect(selectClipCandidates(input, 5, 0.7).map((item) => item.id)).toEqual(['strong']);
  });

  it('avoids overlapping clips when selecting multiple candidates', () => {
    const input = [
      candidate({ id: 'best', startSeconds: 0, endSeconds: 30, score: 0.95 }),
      candidate({ id: 'overlap', startSeconds: 20, endSeconds: 50, score: 0.9 }),
      candidate({ id: 'separate', startSeconds: 55, endSeconds: 85, score: 0.85 }),
    ];

    expect(selectClipCandidates(input, 2).map((item) => item.id)).toEqual(['best', 'separate']);
  });
});
