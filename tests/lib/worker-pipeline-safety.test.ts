import { describe, expect, it } from 'vitest';
import { runContentEngine } from '../../src/lib/worker-pipeline';

const base = {
  loadSource: async () => ({ path: 'source.mp4', durationMs: 120000 }),
  transcribe: async () => ({ text: 'hello world' }),
  analyze: async () => [{ startMs: 0, endMs: 10000, score: 90, text: 'hello' }],
  generate: async () => [{
    startMs: 0, endMs: 10000, score: 90, title: 'Title', caption: 'Caption',
    cta: 'CTA', hashtags: ['#test'],
  }],
  persist: async () => undefined,
  consumeCredits: async () => undefined,
};

describe('content engine credit safety', () => {
  it('does not consume credits when rendering fails', async () => {
    let consumed = false;
    await expect(runContentEngine({
      ...base,
      render: async () => { throw new Error('RENDER_FAILED'); },
      consumeCredits: async () => { consumed = true; },
    }, { projectId: 'p1', mode: 'affiliate' })).rejects.toThrow('RENDER_FAILED');
    expect(consumed).toBe(false);
  });

  it('rejects more than five generated outputs', async () => {
    const outputs = Array.from({ length: 6 }, (_, index) => ({
      startMs: index * 10000, endMs: index * 10000 + 9000, score: 80,
      title: 'Title', caption: 'Caption', cta: 'CTA', hashtags: ['#test'],
    }));
    await expect(runContentEngine({
      ...base,
      generate: async () => outputs,
      render: async output => ({ outputPath: `out-${output.startMs}.mp4` }),
    }, { projectId: 'p1', mode: 'affiliate' })).rejects.toThrow('OUTPUT_COUNT_INVALID');
  });
});
