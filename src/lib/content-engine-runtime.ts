import type { ContentMode } from './types/core';
import { segmentTranscript, mergeShortSegments } from './segmentation';
import { selectDiverseCandidates } from './scoring';
import { createModeAwareContentGenerator, type GeneratedContent } from './content-generator';
import type { LLMProvider } from './content-pack';
import type { ContentEngineWorkerDeps } from './content-engine-worker';
import { createSupabaseSourceLoader } from './source-loader';
import { createHttpTranscriptionProvider } from './stt';
import { claimNextContentEngineJob, updateContentEngineStage, failContentEngineJob, renewContentEngineLease } from './worker-db';

type RuntimeInput = Partial<Pick<ContentEngineWorkerDeps, 'claim' | 'stage' | 'fail' | 'loadSource' | 'transcribe'>> &
  Pick<ContentEngineWorkerDeps, 'render' | 'persist' | 'consumeCredits' | 'releaseCredits'> & {
  contentPackProvider: LLMProvider;
  env?: Record<string, string | undefined>;
  heartbeatIntervalMs?: number;
};

export function createContentEngineDependencies(input: RuntimeInput): ContentEngineWorkerDeps {
  const env = input.env ?? process.env;
  const transcription = createHttpTranscriptionProvider(env);
  const generator = createModeAwareContentGenerator(input.contentPackProvider);

  return {
    ...input,
    heartbeatIntervalMs: input.heartbeatIntervalMs ?? 60_000,
    renew: renewContentEngineLease,
    claim: input.claim ?? (() => claimNextContentEngineJob()),
    stage: input.stage ?? updateContentEngineStage,
    fail: input.fail ?? failContentEngineJob,
    loadSource: input.loadSource ?? createSupabaseSourceLoader(env),
    transcribe: input.transcribe ?? ((source) => transcription.transcribe({ sourcePath: source.path, language: 'id' })),
    segment: (transcript: Parameters<typeof segmentTranscript>[0]) =>
      mergeShortSegments(segmentTranscript(transcript)),
    score: (segments, mode) => selectDiverseCandidates(segments, mode, 5, 0.72),
    generate: async (candidates, _transcript, mode) => {
      const generated = await generator(candidates as never, mode);
      return generated.map(toWorkerOutput);
    },
  };
}

function toWorkerOutput(item: GeneratedContent) {
  return {
    segmentId: item.segmentId,
    title: item.title,
    caption: item.caption,
    hook: item.hook,
    startMs: item.startMs,
    endMs: item.endMs,
  };
}
