import { describe, expect, it } from 'vitest';
import { runContentEngine } from '../../src/lib/worker-pipeline';

describe('content engine worker pipeline', () => {
  it('executes stages in order and returns generated clips', async () => {
    const calls: string[] = [];
    const result = await runContentEngine({
      loadSource: async () => { calls.push('source'); return { path: 'source.mp4', durationMs: 120000 }; },
      transcribe: async () => { calls.push('transcribe'); return { text: 'hello world' }; },
      analyze: async () => { calls.push('analyze'); return [{ startMs: 0, endMs: 30000, score: 90, text: 'hello world' }]; },
      generate: async () => { calls.push('generate'); return [{ startMs: 0, endMs: 30000, score: 90, title: 'Hook', caption: 'Caption', cta: 'CTA', hashtags: ['#test'] }]; },
      render: async () => { calls.push('render'); return { outputPath: 'clips/1.mp4' }; },
      persist: async () => { calls.push('persist'); },
      consumeCredits: async () => { calls.push('consume'); },
    }, { projectId: 'p1', mode: 'affiliate' });
    expect(calls).toEqual(['source', 'transcribe', 'analyze', 'generate', 'render', 'persist', 'consume']);
    expect(result.outputs).toHaveLength(1);
  });

  it('does not consume credits when a processing stage fails', async () => {
    const consume = { called: false };
    await expect(runContentEngine({
      loadSource: async () => ({ path: 'source.mp4', durationMs: 60000 }),
      transcribe: async () => { throw new Error('STT_FAILED'); },
      analyze: async () => [],
      generate: async () => [],
      render: async () => ({ outputPath: 'unused' }),
      persist: async () => undefined,
      consumeCredits: async () => { consume.called = true; },
    }, { projectId: 'p1', mode: 'podcast' })).rejects.toThrow('STT_FAILED');
    expect(consume.called).toBe(false);
  });
});