import { describe, expect, it } from 'vitest';
import { buildViralExplainerPlan, type TranscriptCue } from './viral-explainer';
import { clipTranscriptForRender, viralExplainerPlanToEditPlan } from './viral-explainer-render';

describe('viral explainer render mapping', () => {
  it('turns the explainer plan into native render instructions', () => {
    const cues: TranscriptCue[] = [
      { start: 0, end: 2, text: 'POV: this is the best way to grow your channel' },
      { start: 2, end: 4, text: 'First, choose your niche' },
      { start: 4, end: 6, text: 'Then automate the workflow' },
      { start: 35, end: 38, text: 'Follow and try it today' },
    ];
    const plan = buildViralExplainerPlan(cues, { duration: 40, format: '9:16', maxClips: 1 });
    const editPlan = viralExplainerPlanToEditPlan(plan, cues);

    expect(editPlan.effects).toEqual(expect.arrayContaining(['motion-zoom', 'jump-cut', 'clean-cut']));
    expect(editPlan.subtitle?.style).toBe('bold-pop');
    expect(editPlan.subtitle?.hook?.text).toContain('POV');
    expect(editPlan.subtitle?.keywords).toEqual(expect.arrayContaining(['best', 'First', 'Then']));
    expect(editPlan.punchIns?.length).toBeGreaterThan(0);
  });

  it('keeps punch-ins bounded to the source duration', () => {
    const cues: TranscriptCue[] = [
      { start: 0, end: 2, text: 'How to do this fast' },
      { start: 9, end: 12, text: 'Important result' },
    ];
    const plan = buildViralExplainerPlan(cues, { duration: 10, format: '1:1' });
    const editPlan = viralExplainerPlanToEditPlan(plan, cues);

    expect(editPlan.punchIns?.every((item) => item.start >= 0 && item.end <= 10)).toBe(true);
    expect(editPlan.reframe?.mode).toBe('face-priority');
  });

  it('rebases stored transcript into the render clip timebase', () => {
    expect(clipTranscriptForRender([
      { start: 0, end: 2, text: 'intro' },
      { start: 10, end: 12, text: 'hook' },
      { start: 12, end: 15, text: 'detail' },
      { start: 20, end: 23, text: 'cta' },
    ], 10, 5)).toEqual([
      { start: 0, end: 2, text: 'hook' },
      { start: 2, end: 5, text: 'detail' },
    ]);
  });
});
