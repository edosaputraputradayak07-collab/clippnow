import {
  learnFromFeedback,
  type PatternMemory,
  type PatternSignals,
} from './pattern-memory';

export type ClipOutcome = {
  outcome: 'selected' | 'rejected';
  signals: PatternSignals;
};

export function learnFromClipOutcomes(
  memory: PatternMemory,
  outcomes: ClipOutcome[],
): PatternMemory {
  let next = memory;

  for (const outcome of outcomes) {
    next = learnFromFeedback(next, outcome);
  }

  return next;
}
