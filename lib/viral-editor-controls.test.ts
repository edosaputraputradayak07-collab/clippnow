import { describe, expect, it } from 'vitest';
import { sanitizeViralEditorControls } from './viral-editor-controls';

describe('viral editor controls', () => {
  it('keeps supported controls, clamps punch-ins, and drops unsafe values', () => {
    const result = sanitizeViralEditorControls({
      format: '9:16',
      subtitleStyle: 'karaoke',
      effects: ['motion-zoom', 'impact-shake', 'not-a-real-effect'],
      punchIns: [
        { start: -4, end: 6, strength: 'strong' },
        { start: 10, end: 4, strength: 'medium' },
      ],
      duration: 12,
    });

    expect(result).toEqual({
      format: '9:16',
      subtitleStyle: 'karaoke',
      effects: ['motion-zoom', 'impact-shake'],
      punchIns: [{ start: 0, end: 6, strength: 'strong' }],
    });
  });
});
