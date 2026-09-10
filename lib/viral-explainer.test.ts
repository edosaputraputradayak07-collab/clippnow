import { describe, expect, it } from 'vitest';
import { buildViralExplainerPlan, type TranscriptCue } from './viral-explainer';

describe('viral explainer plan', () => {
  const cues: TranscriptCue[] = [
    { start: 0, end: 2.2, text: 'POV: this is the single best business idea for creators' },
    { start: 2.2, end: 5.4, text: 'First, open the dashboard and choose your niche' },
    { start: 5.4, end: 8.6, text: 'Then turn the long video into short clips automatically' },
    { start: 8.6, end: 11.5, text: 'The important part is that every clip starts with a hook' },
    { start: 35, end: 38, text: 'Try it now and make your first viral clip today' },
  ];

  it('creates a hook, emphasis moments, and a CTA for an explainer', () => {
    const plan = buildViralExplainerPlan(cues, { duration: 41, maxClips: 1 });

    expect(plan.hook).toBeDefined();
    expect(plan.hook?.start).toBe(0);
    expect(plan.emphasis.length).toBeGreaterThanOrEqual(2);
    expect(plan.cta?.text).toContain('Try it now');
  });

  it('adds dynamic subtitle and punch-in instructions without changing source timing', () => {
    const plan = buildViralExplainerPlan(cues, { duration: 41, maxClips: 1 });

    expect(plan.subtitleStyle).toBe('dynamic-highlight');
    expect(plan.punchIns.some((item) => item.start === 0)).toBe(true);
    expect(plan.clips[0].start).toBe(0);
    expect(plan.clips[0].end).toBeLessThanOrEqual(41);
  });

  it('keeps output within the requested vertical format', () => {
    const plan = buildViralExplainerPlan(cues, { duration: 41, maxClips: 3, format: '9:16' });

    expect(plan.format).toBe('9:16');
    expect(plan.clips.length).toBeLessThanOrEqual(3);
    expect(plan.reframe.mode).toBe('face-priority');
  });
});
