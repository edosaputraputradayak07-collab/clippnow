export type ClipSignals = {
  hook: number;
  curiosity: number;
  emotion: number;
  storyCompleteness: number;
  informationValue: number;
  surprise: number;
  humor: number;
  speakerEnergy: number;
  visualInterest: number;
  pacing: number;
  rewatchPotential: number;
  deadAir: number;
  standaloneContext?: number;
  payoff?: number;
  captionDensity?: number;
  topicRelevance?: number;
  duplicatePenalty?: number;
};

const LEGACY_WEIGHTS: Record<keyof Omit<Required<Pick<ClipSignals,
  'hook' | 'curiosity' | 'emotion' | 'storyCompleteness' | 'informationValue' | 'surprise' |
  'humor' | 'speakerEnergy' | 'visualInterest' | 'pacing' | 'rewatchPotential'
>>, 'deadAir'>, number> = {
  hook: 0.16,
  curiosity: 0.11,
  emotion: 0.09,
  storyCompleteness: 0.12,
  informationValue: 0.07,
  surprise: 0.08,
  humor: 0.05,
  speakerEnergy: 0.07,
  visualInterest: 0.08,
  pacing: 0.09,
  rewatchPotential: 0.08,
};

const DETAIL_WEIGHTS = {
  standaloneContext: 0.09,
  payoff: 0.08,
  captionDensity: 0.03,
  topicRelevance: 0.05,
};

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function optionalSignal(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? clamp(value as number) : fallback;
}

export type ScoreBreakdown = ClipSignals & {
  standaloneContext: number;
  payoff: number;
  captionDensity: number;
  topicRelevance: number;
  duplicatePenalty: number;
  deadAirPenalty: number;
};

export type DetailedClipScore = {
  score: number;
  breakdown: ScoreBreakdown;
};

export function scoreClipCandidateDetailed(signals: ClipSignals): DetailedClipScore {
  const breakdown: ScoreBreakdown = {
    ...signals,
    standaloneContext: optionalSignal(signals.standaloneContext, 0.5),
    payoff: optionalSignal(signals.payoff, 0.5),
    captionDensity: optionalSignal(signals.captionDensity, 0.5),
    topicRelevance: optionalSignal(signals.topicRelevance, 0.5),
    duplicatePenalty: optionalSignal(signals.duplicatePenalty, 0),
    deadAirPenalty: clamp(signals.deadAir) * 0.12,
  };

  const legacyWeighted = (Object.keys(LEGACY_WEIGHTS) as Array<keyof typeof LEGACY_WEIGHTS>).reduce(
    (total, key) => total + clamp(signals[key]) * LEGACY_WEIGHTS[key],
    0,
  );

  const detailWeighted =
    breakdown.standaloneContext * DETAIL_WEIGHTS.standaloneContext +
    breakdown.payoff * DETAIL_WEIGHTS.payoff +
    breakdown.captionDensity * DETAIL_WEIGHTS.captionDensity +
    breakdown.topicRelevance * DETAIL_WEIGHTS.topicRelevance;

  const totalPositiveWeight = Object.values(DETAIL_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
  const normalizedPositive = (legacyWeighted + detailWeighted) / (1 + totalPositiveWeight);
  const score = Number(clamp(normalizedPositive - breakdown.deadAirPenalty - breakdown.duplicatePenalty * 0.1).toFixed(4));

  return { score, breakdown };
}

export function scoreClipCandidate(signals: ClipSignals): number {
  if (
    signals.standaloneContext === undefined &&
    signals.payoff === undefined &&
    signals.captionDensity === undefined &&
    signals.topicRelevance === undefined &&
    signals.duplicatePenalty === undefined
  ) {
    const weighted = (Object.keys(LEGACY_WEIGHTS) as Array<keyof typeof LEGACY_WEIGHTS>).reduce(
      (total, key) => total + clamp(signals[key]) * LEGACY_WEIGHTS[key],
      0,
    );
    const deadAirPenalty = clamp(signals.deadAir) * 0.12;
    return Number(clamp(weighted - deadAirPenalty).toFixed(4));
  }

  return scoreClipCandidateDetailed(signals).score;
}

export type RankedClipCandidate = {
  id: string;
  score: number;
};

export function rankClipCandidates<T extends RankedClipCandidate>(candidates: T[]): T[] {
  return [...candidates].sort((a, b) => b.score - a.score);
}
