export type PatternSignals = Partial<Record<'hook' | 'curiosity' | 'emotion' | 'storyCompleteness' | 'informationValue' | 'surprise' | 'humor' | 'speakerEnergy' | 'visualInterest' | 'pacing' | 'rewatchPotential' | 'deadAir', number>>;

export type PatternFeedback = {
  outcome: 'selected' | 'rejected';
  signals: PatternSignals;
};

export type PatternMemory = {
  samples: number;
  weights: Record<keyof Required<PatternSignals>, number>;
};

const SIGNALS: Array<keyof Required<PatternSignals>> = [
  'hook', 'curiosity', 'emotion', 'storyCompleteness', 'informationValue', 'surprise',
  'humor', 'speakerEnergy', 'visualInterest', 'pacing', 'rewatchPotential', 'deadAir',
];

const LEARNING_RATE = 0.08;

export function createPatternMemory(): PatternMemory {
  return {
    samples: 0,
    weights: Object.fromEntries(SIGNALS.map((signal) => [signal, 0])) as PatternMemory['weights'],
  };
}

function clamp(value: number): number {
  return Math.min(1, Math.max(-1, value));
}

export function learnFromFeedback(memory: PatternMemory, feedback: PatternFeedback): PatternMemory {
  const direction = feedback.outcome === 'selected' ? 1 : -1;
  const weights = { ...memory.weights };

  for (const signal of SIGNALS) {
    const value = feedback.signals[signal];
    if (!Number.isFinite(value)) continue;
    const normalized = Math.min(1, Math.max(0, value as number));
    weights[signal] = Number(clamp(weights[signal] + direction * normalized * LEARNING_RATE).toFixed(6));
  }

  return { samples: memory.samples + 1, weights };
}
