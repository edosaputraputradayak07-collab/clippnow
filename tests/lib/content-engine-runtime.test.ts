import { describe, expect, it, vi } from 'vitest';
import { createContentEngineDependencies } from '../../src/lib/content-engine-runtime';

describe('content engine runtime wiring', () => {
  it('builds worker dependencies from injected providers', () => {
    const deps = createContentEngineDependencies({
      claim: vi.fn(),
      stage: vi.fn(),
      fail: vi.fn(),
      loadSource: vi.fn(),
      transcribe: vi.fn(),
      render: vi.fn(),
      persist: vi.fn(),
      consumeCredits: vi.fn(),
      releaseCredits: vi.fn(),
      contentPackProvider: { generateContentPack: vi.fn() },
    });
    expect(deps.claim).toBeDefined();
    expect(deps.segment).toBeDefined();
    expect(deps.score).toBeDefined();
    expect(deps.generate).toBeDefined();
    expect(deps.renew).toBeDefined();
  });
});
