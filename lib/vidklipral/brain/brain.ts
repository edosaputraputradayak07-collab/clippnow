import { analyzeClipContext, type ClipContext } from './context-analyzer';
import { selectClipCandidates, type ClipCandidate } from './clip-selector';
import { scoreClipCandidate, type ClipSignals } from './scoring';
import type { PatternMemory } from './pattern-memory';

export type BrainCandidate = {
  id: string;
  startSeconds: number;
  endSeconds: number;
  signals: ClipSignals;
  transcript?: string;
  sceneChanges?: number[];
  silenceRanges?: Array<{ start: number; end: number }>;
  speakerChanges?: number[];
};

export type BrainDecision = ClipCandidate & { signals: ClipSignals };

const SIGNAL_KEYS = [
  'hook', 'curiosity', 'emotion', 'storyCompleteness', 'informationValue', 'surprise',
  'humor', 'speakerEnergy', 'visualInterest', 'pacing', 'rewatchPotential', 'deadAir',
] as const;

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function learnedBias(signals: ClipSignals, memory: PatternMemory): number {
  if (memory.samples === 0) return 0;

  const total = SIGNAL_KEYS.reduce((sum, key) => {
    const value = Number.isFinite(signals[key]) ? clamp(signals[key]) : 0;
    return sum + value * memory.weights[key];
  }, 0);

  return total / SIGNAL_KEYS.length;
}

function toContext(candidate: BrainCandidate): ClipContext {
  return analyzeClipContext({
    transcript: candidate.transcript ?? '',
    startSeconds: candidate.startSeconds,
    endSeconds: candidate.endSeconds,
    sceneChanges: candidate.sceneChanges ?? [],
    silenceRanges: candidate.silenceRanges ?? [],
    speakerChanges: candidate.speakerChanges ?? [],
  });
}

export function decideBestClips(
  candidates: BrainCandidate[],
  limit: number,
  memory: PatternMemory,
  minimumScore = 0,
): BrainDecision[] {
  if (limit <= 0) return [];

  const scored: BrainDecision[] = candidates.map((candidate) => {
    const baseScore = scoreClipCandidate(candidate.signals);
    const score = Number(clamp(baseScore + learnedBias(candidate.signals, memory) * 0.15).toFixed(4));

    return {
      id: candidate.id,
      startSeconds: candidate.startSeconds,
      endSeconds: candidate.endSeconds,
      score,
      context: toContext(candidate),
      signals: candidate.signals,
    };
  });

  return selectClipCandidates(scored, limit, minimumScore) as BrainDecision[];
}
