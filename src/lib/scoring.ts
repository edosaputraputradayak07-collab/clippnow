import type { ContentMode } from './types/core';
import type { ContentSegment } from './segmentation';

export type ClipCandidateSignals = {
  hook: number;
  retention: number;
  emotion: number;
  clarity: number;
  shareability: number;
  modeRelevance: number;
  cta: number;
  novelty: number;
};

export type ScoredClipCandidate = ContentSegment & {
  score: number;
  signals: ClipCandidateSignals;
};

const WEIGHTS: Record<keyof ClipCandidateSignals, number> = {
  hook: 0.18,
  retention: 0.16,
  emotion: 0.10,
  clarity: 0.14,
  shareability: 0.10,
  modeRelevance: 0.16,
  cta: 0.08,
  novelty: 0.08,
};

const MODE_TERMS: Record<ContentMode, readonly string[]> = {
  affiliate: ['beli', 'link', 'harga', 'promo', 'manfaat', 'rekomendasi', 'coba'],
  seller: ['produk', 'pesan', 'harga', 'promo', 'kualitas', 'toko', 'garansi'],
  live_seller: ['checkout', 'promo', 'diskon', 'tanya', 'jawab', 'stok', 'sekarang'],
  podcast: ['menurut', 'cerita', 'pengalaman', 'kenapa', 'pendapat', 'insight'],
  educator: ['cara', 'tips', 'langkah', 'fakta', 'belajar', 'contoh', 'kesimpulan'],
};

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function tokenSet(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/\W+/).filter(Boolean));
}

function overlap(a: string, b: string): number {
  const left = tokenSet(a);
  const right = tokenSet(b);
  if (!left.size || !right.size) return 0;
  let common = 0;
  for (const token of left) if (right.has(token)) common += 1;
  return common / Math.max(left.size, right.size);
}

function countMatches(text: string, terms: readonly string[]): number {
  const tokens = tokenSet(text);
  return terms.filter((term) => tokens.has(term)).length;
}

export function scoreSegment(segment: ContentSegment, mode: ContentMode): ScoredClipCandidate {
  const text = segment.text.toLowerCase();
  const firstWords = text.split(/\s+/).slice(0, 12).join(' ');
  const modeTerms = MODE_TERMS[mode];

  const hook = clamp(
    (firstWords.length >= 20 ? 0.35 : 0.1) +
      (/[?!]/.test(firstWords) ? 0.3 : 0) +
      (/\b(ini|cara|kenapa|ternyata|rahasia|jangan)\b/.test(firstWords) ? 0.35 : 0),
  );
  const retention = clamp(1 - Math.abs(segment.durationMs - 35_000) / 45_000);
  const emotion = clamp((text.match(/\b(luar biasa|gila|serius|takut|senang|sayang|benci|kaget|ternyata)\b/g) ?? []).length / 3);
  const clarity = clamp(segment.wordCount >= 25 && segment.wordCount <= 105 ? 1 : segment.wordCount / 105);
  const shareability = clamp((text.match(/\b(kamu|kalian|orang|semua|pernah|tahu)\b/g) ?? []).length / 4);
  const modeRelevance = clamp(countMatches(text, modeTerms) / Math.max(3, Math.ceil(modeTerms.length / 2)));
  const cta = clamp((text.match(/\b(beli|klik|cek|coba|follow|subscribe|simpan|share|komen|checkout)\b/g) ?? []).length / 2);
  const novelty = clamp(0.5 + (segment.wordCount % 17) / 34);

  const signals: ClipCandidateSignals = {
    hook,
    retention,
    emotion,
    clarity,
    shareability,
    modeRelevance,
    cta,
    novelty,
  };

  const weightedScore = Object.entries(signals).reduce(
    (sum, [key, value]) => sum + value * WEIGHTS[key as keyof ClipCandidateSignals],
    0,
  );

  return {
    ...segment,
    score: Math.round(weightedScore * 1000) / 10,
    signals,
  };
}

export function selectDiverseCandidates(
  segments: ContentSegment[],
  mode: ContentMode,
  limit = 5,
  minimumOverlap = 0.72,
): ScoredClipCandidate[] {
  if (!Number.isInteger(limit) || limit <= 0) throw new Error('SELECTION_LIMIT_INVALID');
  if (minimumOverlap < 0 || minimumOverlap > 1) throw new Error('SELECTION_OVERLAP_INVALID');

  const ranked = segments
    .map((segment) => scoreSegment(segment, mode))
    .sort((a, b) => b.score - a.score || a.startMs - b.startMs);

  const selected: ScoredClipCandidate[] = [];
  for (const candidate of ranked) {
    if (selected.some((existing) => overlap(existing.text, candidate.text) >= minimumOverlap)) continue;
    selected.push(candidate);
    if (selected.length >= limit) break;
  }

  return selected;
}
