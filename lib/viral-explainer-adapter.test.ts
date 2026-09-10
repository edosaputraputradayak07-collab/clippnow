import { describe, expect, it } from 'vitest';
import { buildExplainerPlanFromSegments } from './viral-explainer-adapter';

describe('viral explainer transcript adapter', () => {
  it('maps AI transcript segments into the native explainer plan', () => {
    const plan = buildExplainerPlanFromSegments(
      [
        { start: 0, end: 2, text: 'POV: this is the single best idea' },
        { start: 2, end: 5, text: 'First, choose your niche' },
        { start: 5, end: 8, text: 'Then automate the clips' },
        { start: 35, end: 38, text: 'Try it now and start today' },
      ],
      { duration: 40, format: '9:16', maxClips: 3 },
    );

    expect(plan.hook?.text).toContain('single best');
    expect(plan.cta?.text).toContain('Try it now');
    expect(plan.reframe.format).toBe('9:16');
    expect(plan.clips.length).toBeGreaterThan(0);
  });
});
