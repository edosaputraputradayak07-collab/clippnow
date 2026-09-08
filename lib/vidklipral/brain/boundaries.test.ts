import { describe, expect, it } from 'vitest';
import { chooseNaturalBoundaries } from './boundaries';

describe('chooseNaturalBoundaries', () => {
  it('snaps requested bounds to nearby sentence or speaker boundaries', () => {
    const result = chooseNaturalBoundaries(
      [
        { startSeconds: 0, endSeconds: 5, text: 'Kalimat pertama.' },
        { startSeconds: 5.2, endSeconds: 11, text: 'Kalimat kedua.' },
        { startSeconds: 11.3, endSeconds: 17, text: 'Kalimat ketiga.' },
      ],
      5.1,
      16.8,
      1,
    );
    expect(result?.startSeconds).toBe(5.2);
    expect(result?.endSeconds).toBe(17);
  });

  it('returns null when no valid window can be produced', () => {
    expect(chooseNaturalBoundaries([], 0, 5, 1)).toBeNull();
  });
});
