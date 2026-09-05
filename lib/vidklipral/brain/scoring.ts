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
};

const WEIGHTS: Record<keyof Omit<ClipSignals, 'deadAir'>, number> = {
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

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function scoreClipCandidate(signals: ClipSignals): number {
  const weighted = (Object.keys(WEIGHTS) as Array<keyof typeof WEIGHTS>).reduce(
    (total, key) => total + clamp(signals[key]) * WEIGHTS[key],
    0,
  );

  const deadAirPenalty = clamp(signals.deadAir) * 0.12;
  return Number(clamp(weighted - deadAirPenalty).toFixed(4));
}

export type RankedClipCandidate = {
  id: string;
  score: number;
};

export function rankClipCandidates<T extends RankedClipCandidate>(candidates: T[]): T[] {
  return [...candidates].sort((a, b) => b.score - a.score);
}
