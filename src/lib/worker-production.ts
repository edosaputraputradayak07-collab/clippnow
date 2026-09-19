import { createSupabaseAdminClient } from './supabase/admin';
import { createHttpLLMProvider } from './llm';
import { createHttpRenderProvider } from './render-provider';
import { createSupabaseClipPersister } from './clip-persistence';
import { createWorkerCreditActions } from './worker-credits';
import { createContentEngineDependencies } from './content-engine-runtime';import type { ContentEngineWorkerDeps } from './content-engine-worker';
import type { LLMProvider } from './content-pack';
import type { RenderProvider } from './render-plan';

type ProductionWorkerOverrides = Partial<Pick<
  ContentEngineWorkerDeps,
  'claim' | 'stage' | 'fail' | 'renew' | 'loadSource' | 'transcribe'
>> & {
  env?: Record<string, string | undefined>;
  contentPackProvider?: LLMProvider;
  renderProvider?: RenderProvider;
};

export function createProductionContentEngineDependencies(
  input: ProductionWorkerOverrides = {},
): ContentEngineWorkerDeps {
  const env = input.env ?? process.env;
  const creditActions = createWorkerCreditActions();
  const contentPackProvider = input.contentPackProvider ?? createHttpLLMProvider(env);
  const renderProvider = input.renderProvider ?? createHttpRenderProvider(env);

  return createContentEngineDependencies({
    ...(input.claim ? { claim: input.claim } : {}),
    ...(input.stage ? { stage: input.stage } : {}),
    ...(input.fail ? { fail: input.fail } : {}),
    ...(input.loadSource ? { loadSource: input.loadSource } : {}),
    ...(input.transcribe ? { transcribe: input.transcribe } : {}),
    render: async (output, source, mode, context) => {
      if (!context) throw new Error('RENDER_CONTEXT_REQUIRED');
      return createWorkerRenderer(renderProvider)(output, source, mode, context);
    },
    persist: createSupabaseClipPersister(() => createSupabaseAdminClient() as never),
    consumeCredits: async (job) => { await creditActions.consume({ userId: job.userId, jobId: job.id }); },
    releaseCredits: async (job) => { await creditActions.release({ userId: job.userId, jobId: job.id }); },
    contentPackProvider,
    env,
  });
}

import { createWorkerRenderer } from './worker-renderer';
