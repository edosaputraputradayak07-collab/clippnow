import type { RenderPlan, RenderProvider } from './render-plan';

export function createHttpRenderProvider(env: Record<string, string | undefined> = process.env): RenderProvider {
  const endpoint = env.RENDER_API_URL;
  const apiKey = env.RENDER_API_KEY;
  if (!endpoint || !apiKey) throw new Error('RENDER_PROVIDER_NOT_CONFIGURED');
  return {
    async render(plan: RenderPlan) {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ plan }), cache: 'no-store' });
      if (!response.ok) throw new Error(`RENDER_REQUEST_FAILED:${response.status}`);
      const body = await response.json() as { outputPath?: string };
      if (!body.outputPath) throw new Error('RENDER_RESPONSE_INVALID');
      return { outputPath: body.outputPath };
    },
  };
}
