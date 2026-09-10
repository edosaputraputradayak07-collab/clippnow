import { buildViralExplainerPlan, type TranscriptCue, type ViralExplainerFormat, type ViralExplainerPlan } from './viral-explainer';

type Segment = { start: number; end: number; text: string };

type AdapterOptions = {
  duration: number;
  format?: ViralExplainerFormat;
  maxClips?: number;
};

export function buildExplainerPlanFromSegments(segments: Segment[], options: AdapterOptions): ViralExplainerPlan {
  const cues: TranscriptCue[] = segments.map((segment) => ({
    start: Number(segment.start),
    end: Number(segment.end),
    text: String(segment.text ?? ''),
  }));

  return buildViralExplainerPlan(cues, options);
}
