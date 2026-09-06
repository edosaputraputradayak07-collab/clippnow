import { analyzeClipContext } from './context-analyzer';
import { chooseNaturalBoundaries } from './boundaries';
import { classifyRetentionShape, type RetentionShape, type TranscriptSegment } from './retention';
import { scoreClipCandidateDetailed, type ScoreBreakdown } from './scoring';
import type { PatternMemory } from './pattern-memory';

export type CandidateAnalyzerOptions = {
  minDurationSeconds?: number;
  maxDurationSeconds?: number;
  patternMemory?: PatternMemory;
};

export type AnalyzedClipCandidate = {
  id: string;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  transcript: string;
  score: number;
  breakdown: ScoreBreakdown;
  retention: RetentionShape;
  reasonLabels: string[];
};

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function candidateSignals(retention: RetentionShape, transcript: string, durationSeconds: number) {
  const lower = transcript.toLowerCase();
  const punctuationHook = /[?!]/.test(transcript) ? 1 : 0.5;
  const curiosity = /rahasia|ternyata|tidak percaya|mengapa|kenapa|bagaimana|what|why|how/i.test(transcript) ? 1 : 0.45;
  const emotion = /takut|senang|marah|sedih|kaget|gagal|berhasil|luar biasa|shocked|love|hate/i.test(lower) ? 0.9 : 0.45;
  const informationValue = /angka|persen|juta|ribu|cara|langkah|tips|modal|omzet|hasil/i.test(lower) ? 0.85 : 0.5;
  const surprise = /ternyata|tiba-tiba|tidak menyangka|justru|malah|surprisingly/i.test(lower) ? 0.9 : 0.45;
  const humor = /haha|wkwk|lucu|ketawa|becanda|joke/i.test(lower) ? 0.9 : 0.35;
  const pacing = durationSeconds >= 12 && durationSeconds <= 60 ? 0.9 : 0.65;
  const speakerEnergy = /!/.test(transcript) ? 0.85 : 0.6;

  return {
    hook: retention.hasHook ? 0.95 : punctuationHook,
    curiosity,
    emotion,
    storyCompleteness: retention.hasPayoff ? 0.95 : retention.hasEscalation ? 0.75 : 0.45,
    informationValue,
    surprise,
    humor,
    speakerEnergy,
    visualInterest: 0.5,
    pacing,
    rewatchPotential: retention.hasHook && retention.hasPayoff ? 0.9 : 0.55,
    deadAir: 0,
    standaloneContext: retention.hasContext ? 0.9 : 0.4,
    payoff: retention.hasPayoff ? 0.95 : 0.4,
    captionDensity: transcript.split(/\s+/).length / Math.max(1, durationSeconds * 3),
    topicRelevance: 0.7,
    duplicatePenalty: 0,
  };
}

function labels(retention: RetentionShape, breakdown: ScoreBreakdown): string[] {
  return unique([
    retention.hasHook ? 'strong-hook' : '',
    retention.hasContext ? 'standalone-context' : '',
    retention.hasEscalation ? 'story-escalation' : '',
    retention.hasPayoff ? 'complete-story' : '',
    breakdown.deadAirPenalty < 0.03 ? 'low-dead-air' : '',
    breakdown.payoff >= 0.8 ? 'strong-payoff' : '',
  ].filter(Boolean));
}

function applyPatternAdjustment(score: number, breakdown: ScoreBreakdown, memory: PatternMemory | undefined): number {
  if (!memory || memory.samples === 0) return score;
  const signalValues: Record<string, number> = {
    hook: breakdown.hook,
    curiosity: breakdown.curiosity,
    emotion: breakdown.emotion,
    storyCompleteness: breakdown.storyCompleteness,
    informationValue: breakdown.informationValue,
    surprise: breakdown.surprise,
    humor: breakdown.humor,
    speakerEnergy: breakdown.speakerEnergy,
    visualInterest: breakdown.visualInterest,
    pacing: breakdown.pacing,
    rewatchPotential: breakdown.rewatchPotential,
    deadAir: breakdown.deadAir,
  };
  const adjustment = Object.entries(memory.weights).reduce(
    (sum, [signal, weight]) => sum + (signalValues[signal] ?? 0.5) * weight,
    0,
  ) / Math.max(1, memory.samples);
  return Number(Math.min(1, Math.max(0, score + adjustment * 0.02)).toFixed(4));
}

export function analyzeClipCandidates(
  segments: TranscriptSegment[],
  options: CandidateAnalyzerOptions = {},
): AnalyzedClipCandidate[] {
  const minDuration = Math.max(1, options.minDurationSeconds ?? 15);
  const maxDuration = Math.max(minDuration, options.maxDurationSeconds ?? 60);
  const validSegments = segments
    .filter((segment) => Number.isFinite(segment.startSeconds) && Number.isFinite(segment.endSeconds) && segment.endSeconds > segment.startSeconds && segment.text.trim())
    .map((segment) => ({ ...segment, text: segment.text.trim().replace(/\s+/g, ' ') }))
    .sort((a, b) => a.startSeconds - b.startSeconds);

  const results: AnalyzedClipCandidate[] = [];
  const seen = new Set<string>();

  for (let startIndex = 0; startIndex < validSegments.length; startIndex += 1) {
    const window: TranscriptSegment[] = [];
    for (let endIndex = startIndex; endIndex < validSegments.length; endIndex += 1) {
      window.push(validSegments[endIndex]);
      const requestedStart = window[0].startSeconds;
      const requestedEnd = window[window.length - 1].endSeconds;
      const requestedDuration = requestedEnd - requestedStart;
      if (requestedDuration < minDuration) continue;
      if (requestedDuration > maxDuration) break;

      const boundary = chooseNaturalBoundaries(validSegments, requestedStart, requestedEnd, 1.5);
      if (!boundary) continue;
      const transcript = window.map((segment) => segment.text).join(' ').trim();
      const key = normalizeText(transcript);
      if (!key || seen.has(key)) continue;

      const retention = classifyRetentionShape(window);
      const context = analyzeClipContext({
        transcript,
        startSeconds: boundary.startSeconds,
        endSeconds: boundary.endSeconds,
      });
      const signals = candidateSignals(retention, transcript, context.durationSeconds);
      const detailed = scoreClipCandidateDetailed(signals);
      const score = applyPatternAdjustment(detailed.score, detailed.breakdown, options.patternMemory);
      seen.add(key);

      results.push({
        id: `candidate-${results.length + 1}`,
        startSeconds: boundary.startSeconds,
        endSeconds: boundary.endSeconds,
        durationSeconds: context.durationSeconds,
        transcript,
        score,
        breakdown: detailed.breakdown,
        retention,
        reasonLabels: labels(retention, detailed.breakdown),
      });
    }
  }

  return results.sort((a, b) => b.score - a.score || a.startSeconds - b.startSeconds);
}
