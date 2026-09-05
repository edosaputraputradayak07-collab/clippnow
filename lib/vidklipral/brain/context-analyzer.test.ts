import { describe, expect, it } from 'vitest';
import { analyzeClipContext } from './context-analyzer';

describe('analyzeClipContext', () => {
  it('normalizes transcript and timing signals into clip context', () => {
    const context = analyzeClipContext({
      transcript: '  Ini   contoh   hook yang kuat!  ',
      startSeconds: 12.5,
      endSeconds: 42.5,
      sceneChanges: [15, 27, 39],
      silenceRanges: [{ start: 20, end: 21.2 }],
      speakerChanges: [30],
    });

    expect(context.transcript).toBe('Ini contoh hook yang kuat!');
    expect(context.durationSeconds).toBe(30);
    expect(context.sceneChangeRate).toBe(0.1);
    expect(context.silenceRatio).toBeCloseTo(1.2 / 30, 5);
    expect(context.speakerChangeRate).toBeCloseTo(1 / 30, 5);
  });

  it('clamps invalid timing and ignores events outside the clip', () => {
    const context = analyzeClipContext({
      transcript: 'hello',
      startSeconds: 50,
      endSeconds: 40,
      sceneChanges: [-1, 45, 60],
      silenceRanges: [{ start: 10, end: 20 }, { start: 41, end: 45 }],
      speakerChanges: [39, 41],
    });

    expect(context.durationSeconds).toBe(0);
    expect(context.sceneChangeRate).toBe(0);
    expect(context.silenceRatio).toBe(0);
    expect(context.speakerChangeRate).toBe(0);
  });
});
