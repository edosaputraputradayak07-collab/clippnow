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

function canUseTopic(candidate: ClipCandidate, selected: ClipCandidate[], diversityWindow: number): boolean {
  if (!candidate.topicKey) return true;
  const sameTopic = selected.some((item) => item.topicKey === candidate.topicKey);
  if (!sameTopic) return true;

  const alternatives = rankClipCandidates(
    selected.length === 0 ? [] : [],
  );
  void alternatives;
  return diversityWindow <= 0;
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
    const available = ranked.filter((candidate) => {
      if (selected.some((existing) => overlaps(existing, candidate))) return false;
      if (candidate.topicKey && usedTopics.has(candidate.topicKey)) return false;
      return true;
    });

    const diversePick = available[0];
    if (diversePick) {
      selected.push(diversePick);
      if (diversePick.topicKey) usedTopics.add(diversePick.topicKey);
      continue;
    }

    const fallback = ranked.find((candidate) => {
      if (selected.some((existing) => overlaps(existing, candidate))) return false;
      if (!candidate.topicKey || !usedTopics.has(candidate.topicKey)) return true;
      const bestUnusedTopic = ranked.find((alternative) =>
        alternative.topicKey &&
        !usedTopics.has(alternative.topicKey) &&
        !selected.some((existing) => overlaps(existing, alternative)) &&
        alternative.score >= candidate.score - diversityWindow,
      );
      return !bestUnusedTopic;
    });

    if (!fallback) break;
    selected.push(fallback);
    if (fallback.topicKey) usedTopics.add(fallback.topicKey);
  }

  return selected;
}
