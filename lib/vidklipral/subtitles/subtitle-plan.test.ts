import { describe, expect, it } from 'vitest';
import { buildSubtitlePlan, type SubtitleWord } from './subtitle-plan';

describe('buildSubtitlePlan', () => {
  const words: SubtitleWord[] = [
    { startSeconds: 0, endSeconds: 0.4, text: 'Kita' },
    { startSeconds: 0.4, endSeconds: 0.9, text: 'bikin' },
    { startSeconds: 0.9, endSeconds: 1.4, text: 'video' },
    { startSeconds: 1.4, endSeconds: 1.9, text: 'viral' },
  ];

  it('groups timed words into safe-zone caption cues and preserves word timing', () => {
    const plan = buildSubtitlePlan(words, { style: 'bold-pop', position: 'bottom', maxWordsPerCue: 3 });

    expect(plan.cues).toHaveLength(2);
    expect(plan.cues[0].startSeconds).toBe(0);
    expect(plan.cues[0].endSeconds).toBe(1.4);
    expect(plan.cues[0].words.map((word) => word.text)).toEqual(['Kita', 'bikin', 'video']);
    expect(plan.cues[0].safeZone).toBe('bottom');
    expect(plan.cues[0].style).toBe('bold-pop');
  });

  it('highlights explicit keywords and builds a hook overlay', () => {
    const plan = buildSubtitlePlan(words, {
      style: 'karaoke',
      position: 'top',
      keywords: ['viral'],
      hook: { text: 'INI BIKIN VIRAL', startSeconds: 0.2, endSeconds: 2.2 },
    });

    expect(plan.cues.flatMap((cue) => cue.words).find((word) => word.text === 'viral')?.highlight).toBe(true);
    expect(plan.hook).toEqual({ text: 'INI BIKIN VIRAL', startSeconds: 0.2, endSeconds: 2.2 });
    expect(plan.cues[0].safeZone).toBe('top');
  });

  it('normalizes invalid timings and supports clean style', () => {
    const plan = buildSubtitlePlan([
      { startSeconds: -1, endSeconds: 0.5, text: 'Halo' },
      { startSeconds: 0.5, endSeconds: 0.4, text: 'invalid' },
      { startSeconds: 0.6, endSeconds: 1.1, text: 'dunia' },
    ], { style: 'clean', position: 'center' });

    expect(plan.cues).toHaveLength(1);
    expect(plan.cues[0].words.map((word) => word.text)).toEqual(['Halo', 'dunia']);
    expect(plan.cues[0].words[0].startSeconds).toBe(0);
    expect(plan.cues[0].safeZone).toBe('center');
  });
});
