import { describe, expect, it, vi } from 'vitest';
import { createProductionContentEngineDependencies } from '../../src/lib/worker-production';

describe('production worker wiring', () => {
  it('wires claim, render, persistence, and credit settlement behind provider configuration', () => {
    const deps = createProductionContentEngineDependencies({
      env: {
        STT_API_URL:'https://stt.example',
        STT_API_KEY:'stt',
        LLM_API_URL:'https://llm.example',
        LLM_API_KEY:'llm',
        RENDER_API_URL:'https://render.example',
        RENDER_API_KEY:'render',
      },
      claim: vi.fn(),
      stage: vi.fn(),
      fail: vi.fn(),
      renew: vi.fn(),
      loadSource: vi.fn(),
      transcribe: vi.fn(),
    });

    expect(deps.claim).toBeDefined();
    expect(deps.render).toBeDefined();
    expect(deps.persist).toBeDefined();
    expect(deps.consumeCredits).toBeDefined();
    expect(deps.releaseCredits).toBeDefined();
  });
});