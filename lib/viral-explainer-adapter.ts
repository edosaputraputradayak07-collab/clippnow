import { buildViralExplainerPlan, type TranscriptCue, type ViralExplainerFormat, type ViralExplainerPlan } from './viral-explainer';

type Segment = { start: number; end: number; text: string };

type AdapterOptions = {
  duration: number;
  format?: ViralExplainerFormat;
  maxClips?: number;
};

export function rebaseTranscriptSegments(segments: Segment[], offset: number, duration: number): Segment[] {
  const safeOffset = Number.isFinite(offset) ? offset : 0;
  const safeDuration = Math.max(0, Number.isFinite(duration) ? duration : 0);

  return segments
    .map((segment) => ({
      start: Math.max(0, Number(segment.start) - safeOffset),
      end: Math.min(safeDuration, Number(segment.end) - safeOffset),
      text: String(segment.text ?? '').trim(),
    }))
    .filter((segment) => Number.isFinite(segment.start) && Number.isFinite(segment.end) && segment.end > segment.start && segment.text);
}

export function buildExplainerPlanFromSegments(segments: Segment[], options: AdapterOptions): ViralExplainerPlan {
  const cues: TranscriptCue[] = segments.map((segment) => ({
    start: Number(segment.start),
    end: Number(segment.end),
    text: String(segment.text ?? ''),
  }));

  return buildViralExplainerPlan(cues, options);
}
