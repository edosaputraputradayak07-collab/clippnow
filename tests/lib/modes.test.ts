import { describe, expect, it } from 'vitest';
import { CONTENT_MODES } from '../../src/lib/types/core';
import { getModeConfig } from '../../src/lib/modes';

describe('content modes', () => {
  it('exposes exactly five product modes', () => {
    expect(CONTENT_MODES).toEqual(['affiliate', 'seller', 'live_seller', 'podcast', 'educator']);
  });

  it.each(CONTENT_MODES)('returns a complete config for %s', (mode) => {
    const config = getModeConfig(mode);
    expect(config.id).toBe(mode);
    expect(config.label.length).toBeGreaterThan(0);
    expect(config.description.length).toBeGreaterThan(0);
    expect(config.signals.length).toBeGreaterThan(0);
  });
});
