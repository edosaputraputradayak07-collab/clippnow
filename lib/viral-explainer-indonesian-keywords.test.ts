import { describe, expect, it } from 'vitest';
import type { TranscriptCue } from './viral-explainer';
import { viralExplainerPlanToEditPlan } from './viral-explainer-render';

describe('Indonesian viral keyword mapping', () => {
  it('highlights common Indonesian hook and CTA words', () => {
    const cues: TranscriptCue[] = [
      { start: 0, end: 4, text: 'Cara paling penting: jangan lewatkan hasil ini hari ini' },
      { start: 4, end: 8, text: 'Ikuti langkah pertama dan coba sekarang' },
    ];

    const plan = {
      hook: { text: cues[0].text, start: 0, end: 4 },
      punchIns: [],
      reframe: { mode: 'face-priority' as const, format: '9:16' as const },
      format: '9:16' as const,
    };

    const editPlan = viralExplainerPlanToEditPlan(plan, cues);
    expect(editPlan.subtitle.keywords).toEqual(
      expect.arrayContaining(['Cara', 'penting', 'jangan', 'hasil', 'hari', 'Ikuti', 'langkah', 'pertama', 'coba']),
    );
  });
});
