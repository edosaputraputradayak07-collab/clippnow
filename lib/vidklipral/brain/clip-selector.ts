import { rankClipCandidates } from './scoring';
import type { ClipContext } from './context-analyzer';

export type ClipCandidate = {
  id: string;
  startSeconds: number;
  endSeconds: number;
  score: number;
  context: ClipContext;
  topicKey?: string;
};

function overlaps(a: ClipCandidate, b: ClipCandidate): boolean {
  return a.startSeconds < b.endSeconds && b.startSeconds < a.endSeconds;
}

export function selectClipCandidates(
  candidates: ClipCandidate[],
  limit: number,
  minimumScore = 0,
  diversityWindow = 0.03,
): ClipCandidate[] {
  if (limit <= 0) return [];

  const ranked = rankClipCandidates(
    candidates.filter(
      (candidate) =>
        Number.isFinite(candidate.startSeconds) &&
        Number.isFinite(candidate.endSeconds) &&
        candidate.endSeconds > candidate.startSeconds &&
        Number.isFinite(candidate.score) &&
        candidate.score >= minimumScore,
    ),
  );

  const selected: ClipCandidate[] = [];
  const usedTopics = new Set<string>();

  while (selected.length < limit) {
    const available = ranked.filter((candidate) => !selected.some((existing) => overlaps(existing, candidate)));
    if (available.length === 0) break;

    const best = available[0];
    let pick = best;

    if (best.topicKey && usedTopics.has(best.topicKey)) {
      const diverseAlternative = available.find(
        (candidate) =>
          candidate.topicKey &&
          !usedTopics.has(candidate.topicKey) &&
          candidate.score >= best.score - Math.max(0, diversityWindow),
      );
      if (diverseAlternative) pick = diverseAlternative;
    }

    selected.push(pick);
    if (pick.topicKey) usedTopics.add(pick.topicKey);
  }

  return selected;
}
