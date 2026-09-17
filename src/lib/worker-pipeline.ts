import type { ContentMode } from './types/core';

type Source = { path: string; durationMs: number };
type Transcript = { text: string };
type Candidate = { startMs: number; endMs: number; score: number; text: string };
type Output = { startMs: number; endMs: number; score: number; title: string; caption: string; cta: string; hashtags: string[] };

export type ContentEngineSteps = {
  loadSource: () => Promise<Source>;
  transcribe: (source: Source) => Promise<Transcript>;
  analyze: (transcript: Transcript, mode: ContentMode) => Promise<Candidate[]>;
  generate: (candidates: Candidate[], transcript: Transcript, mode: ContentMode) => Promise<Output[]>;
  render: (output: Output, source: Source, mode: ContentMode) => Promise<{ outputPath: string }>;
  persist: (output: Output, rendered: { outputPath: string }, index: number) => Promise<void>;
  consumeCredits: () => Promise<void>;
};

export async function runContentEngine(steps: ContentEngineSteps, input: { projectId: string; mode: ContentMode }) {
  if (!input.projectId.trim()) throw new Error('PROJECT_ID_REQUIRED');
  const source = await steps.loadSource();
  if (!source.path || !Number.isFinite(source.durationMs) || source.durationMs <= 0) throw new Error('SOURCE_INVALID');
  const transcript = await steps.transcribe(source);
  if (!transcript.text.trim()) throw new Error('TRANSCRIPT_EMPTY');
  const candidates = await steps.analyze(transcript, input.mode);
  if (!candidates.length) throw new Error('NO_CLIP_CANDIDATES');
  const outputs = await steps.generate(candidates, transcript, input.mode);
  if (!outputs.length) throw new Error('NO_CONTENT_PACKS');
  const rendered: Array<{ output: Output; outputPath: string }> = [];
  for (let index = 0; index < outputs.length; index += 1) {
    const output = outputs[index];
    if (output.endMs <= output.startMs) throw new Error(`CLIP_RANGE_INVALID:${index}`);
    const asset = await steps.render(output, source, input.mode);
    if (!asset.outputPath) throw new Error(`RENDER_OUTPUT_INVALID:${index}`);
    await steps.persist(output, asset, index);
    rendered.push({ output, outputPath: asset.outputPath });
  }
  await steps.consumeCredits();
  return { projectId: input.projectId, outputs: rendered };
}
