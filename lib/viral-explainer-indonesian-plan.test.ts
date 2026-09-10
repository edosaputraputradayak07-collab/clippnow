import { describe, expect, it } from 'vitest';
import { buildViralExplainerPlan, type TranscriptCue } from './viral-explainer';

describe('Indonesian viral plan signals', () => {
  it('selects an Indonesian hook and CTA using local-language signals', () => {
    const cues: TranscriptCue[] = [
      { start: 0, end: 3, text: 'Cara paling cepat bikin video viral tanpa ribet' },
      { start: 3, end: 6, text: 'Pertama pilih bagian yang paling penting' },
      { start: 34, end: 38, text: 'Ikuti untuk tips lainnya dan simpan video ini' },
    ];

    const plan = buildViralExplainerPlan(cues, { duration: 40, maxClips: 1 });

    expect(plan.hook?.text).toContain('Cara paling cepat');
    expect(plan.cta?.text).toContain('Ikuti');
    expect(plan.emphasis.some((cue) => cue.text.includes('penting'))).toBe(true);
  });
});
