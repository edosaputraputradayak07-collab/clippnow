import type { ContentMode } from './types/core';
import { segmentTranscript, mergeShortSegments, type ContentSegment } from './segmentation';
import { selectDiverseCandidates, type ScoredClipCandidate } from './scoring';
import type { Transcript } from './transcription';

export function analyzeTranscriptForMode(
  transcript: Transcript,
  mode: ContentMode,
): ScoredClipCandidate[] {
  const segments: ContentSegment[] = mergeShortSegments(segmentTranscript(transcript));
  if (!segments.length) return [];
  return selectDiverseCandidates(segments, mode, 5, 0.72);
}
