import { describe, expect, it } from 'vitest';
import { buildViralEditPlan } from '../../lib/ai/viral-edit-plan';

describe('buildViralEditPlan', () => {
  it('creates a short-form viral plan with hook, subtitles, and effects', () => {
    const plan = buildViralEditPlan({
      durationSeconds: 42,
      format: '9:16',
      goal: 'tiktok',
      transcript: [
        { start: 0, end: 2.5, text: 'Kamu harus lihat ini sekarang!' },
        { start: 2.5, end: 10, text: 'Bagian pertama ini yang paling penting.' },
        { start: 10, end: 20, text: 'Lalu hasilnya ternyata jauh lebih bagus.' },
      ],
    });

    expect(plan.score).toBeGreaterThanOrEqual(70);
    expect(plan.hook.endSeconds - plan.hook.startSeconds).toBeLessThanOrEqual(3);
    expect(plan.subtitle.style).toBe('viral-punch');
    expect(plan.effects).toContain('motion-zoom');
    expect(plan.effects).toContain('beat-flash');
    expect(plan.output.width).toBe(1080);
    expect(plan.output.height).toBe(1920);
  });

  it('does not invent a viral score when there is no speech', () => {
    const plan = buildViralEditPlan({
      durationSeconds: 20,
      format: '16:9',
      goal: 'youtube-shorts',
      transcript: [],
    });

    expect(plan.score).toBe(0);
    expect(plan.hook.endSeconds).toBe(0);
    expect(plan.effects).toEqual([]);
  });
});
