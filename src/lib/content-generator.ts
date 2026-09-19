import type { ContentMode } from './types/core';
import type { ContentPack, LLMProvider } from './content-pack';
import type { ScoredClipCandidate } from './scoring';

export type GeneratedContent = ContentPack & { segmentId: string; startMs: number; endMs: number; score: number };

export function createModeAwareContentGenerator(provider: LLMProvider) {
  return async (
    candidates: ScoredClipCandidate[],
    mode: ContentMode,
  ): Promise<GeneratedContent[]> => {
    const packs = await Promise.all(
      candidates.map(async (candidate) => {
        const pack = await provider.generateContentPack({ candidate, mode });
        if (pack.mode !== mode) throw new Error('CONTENT_PACK_MODE_MISMATCH');
        return {
          ...pack,
          segmentId: candidate.id,
          startMs: candidate.startMs,
          endMs: candidate.endMs,
          score: candidate.score,
        };
      }),
    );
    return packs;
  };
}
