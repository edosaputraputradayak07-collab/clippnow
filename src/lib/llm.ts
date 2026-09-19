import type { ContentPackInput, LLMProvider, ContentPack } from './content-pack';

export function createHttpLLMProvider(env: Record<string, string | undefined> = process.env): LLMProvider {
  const endpoint = env.LLM_API_URL;
  const apiKey = env.LLM_API_KEY;
  if (!endpoint || !apiKey) throw new Error('LLM_PROVIDER_NOT_CONFIGURED');
  return {
    async generateContentPack(input: ContentPackInput): Promise<ContentPack> {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ mode: input.mode, candidate: input.candidate }), cache: 'no-store' });
      if (!response.ok) throw new Error(`LLM_REQUEST_FAILED:${response.status}`);
      const pack = await response.json() as ContentPack;
      if (pack.mode !== input.mode || !pack.hook || !pack.title || !pack.caption || !pack.cta || !Array.isArray(pack.hashtags)) throw new Error('LLM_RESPONSE_INVALID');
      return pack;
    },
  };
}
