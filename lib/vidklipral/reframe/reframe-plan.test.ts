import { describe, expect, it } from 'vitest';
import { buildReframePlan, type ReframeSubject } from './reframe-plan';

describe('buildReframePlan', () => {
  it('focuses a single active speaker for vertical output', () => {
    const subjects: ReframeSubject[] = [
      { id: 'a', startSeconds: 0, endSeconds: 12, x: 0.2, y: 0.35, width: 0.22, height: 0.42, confidence: 0.98, activeSpeaker: true },
      { id: 'b', startSeconds: 0, endSeconds: 12, x: 0.68, y: 0.35, width: 0.2, height: 0.4, confidence: 0.96, activeSpeaker: false },
    ];

    const plan = buildReframePlan(subjects, { aspectRatio: '9:16', durationSeconds: 12 });

    expect(plan).toHaveLength(1);
    expect(plan[0].mode).toBe('single');
    expect(plan[0].subjectIds).toEqual(['a']);
    expect(plan[0].crop.x).toBeGreaterThan(0);
    expect(plan[0].crop.width).toBeLessThanOrEqual(1);
  });

  it('uses split framing when two speakers are simultaneously active', () => {
    const subjects: ReframeSubject[] = [
      { id: 'a', startSeconds: 0, endSeconds: 10, x: 0.05, y: 0.3, width: 0.35, height: 0.5, confidence: 0.98, activeSpeaker: true },
      { id: 'b', startSeconds: 0, endSeconds: 10, x: 0.6, y: 0.3, width: 0.35, height: 0.5, confidence: 0.97, activeSpeaker: true },
    ];

    const plan = buildReframePlan(subjects, { aspectRatio: '9:16', durationSeconds: 10 });

    expect(plan[0].mode).toBe('split');
    expect(plan[0].subjectIds).toEqual(['a', 'b']);
  });

  it('falls back to fit framing when no reliable subject is detected', () => {
    const plan = buildReframePlan([
      { id: 'unknown', startSeconds: 0, endSeconds: 5, x: 0.1, y: 0.1, width: 0.2, height: 0.2, confidence: 0.2, activeSpeaker: false },
    ], { aspectRatio: '16:9', durationSeconds: 5 });

    expect(plan[0].mode).toBe('fit');
    expect(plan[0].subjectIds).toEqual([]);
  });
});
