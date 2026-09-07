import { describe, expect, it } from 'vitest';
import { buildSubtitlePlan } from './subtitle-plan';
import { subtitlePlanToAss } from './ass-renderer';

describe('subtitlePlanToAss', () => {
  it('renders timed cues, style, safe-zone alignment, and keyword highlight', () => {
    const plan = buildSubtitlePlan([
      { startSeconds: 0, endSeconds: 0.4, text: 'Kita' },
      { startSeconds: 0.4, endSeconds: 0.9, text: 'bikin' },
      { startSeconds: 0.9, endSeconds: 1.4, text: 'viral', highlight: true },
    ], { style: 'bold-pop', position: 'bottom', keywords: ['viral'] });

    const ass = subtitlePlanToAss(plan, { width: 1080, height: 1920 });

    expect(ass).toContain('[Script Info]');
    expect(ass).toContain('PlayResX: 1080');
    expect(ass).toContain('PlayResY: 1920');
    expect(ass).toContain('Alignment=2');
    expect(ass).toContain('0:00:00.00,0:00:01.40');
    expect(ass).toContain('Kita bikin');
    expect(ass).toContain('\\c&H00FFFF&viral\\c');
  });

  it('renders karaoke timing and hook overlay without leaking ASS syntax', () => {
    const plan = buildSubtitlePlan([
      { startSeconds: 1, endSeconds: 1.5, text: 'Hello {world}' },
      { startSeconds: 1.5, endSeconds: 2.25, text: 'dunia' },
    ], {
      style: 'karaoke',
      position: 'top',
      hook: { text: 'HOOK {NOW}', startSeconds: 0.25, endSeconds: 1.75 },
    });

    const ass = subtitlePlanToAss(plan, { width: 1080, height: 1920 });

    expect(ass).toContain('Alignment=8');
    expect(ass).toContain('\\k50Hello \\{world\\}');
    expect(ass).toContain('HOOK \\{NOW\\}');
    expect(ass).not.toContain('undefined');
  });
});
