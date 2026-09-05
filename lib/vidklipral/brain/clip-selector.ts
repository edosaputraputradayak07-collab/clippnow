import { rankClipCandidates } from './scoring';
import type { ClipContext } from './context-analyzer';

export type ClipCandidate = {
  id: string;
  startSeconds: number;
  endSeconds: number;
  score: number;
  context: ClipContext;
};

function overlaps(a: ClipCandidate, b: ClipCandidate): boolean {
  return a.startSeconds < b.endSeconds && b.startSeconds < a.endSeconds;
}

export function selectClipCandidates(
  candidates: ClipCandidate[],
  limit: number,
  minimumScore = 0,
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
  for (const candidate of ranked) {
    if (selected.some((existing) => overlaps(existing, candidate))) continue;
    selected.push(candidate);
    if (selected.length >= limit) break;
  }

  return selected;
}
