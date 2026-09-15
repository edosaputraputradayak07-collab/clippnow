import type { Transcript, TranscriptUtterance } from './transcription';

export type ContentSegment = {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  utteranceIds: string[];
  durationMs: number;
  wordCount: number;
};

export type SegmentationOptions = {
  maxDurationMs?: number;
  maxWords?: number;
  pauseThresholdMs?: number;
};

const DEFAULTS: Required<SegmentationOptions> = {
  maxDurationMs: 75_000,
  maxWords: 120,
  pauseThresholdMs: 1_100,
};

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function flush(buffer: TranscriptUtterance[], output: ContentSegment[]): void {
  if (!buffer.length) return;
  const first = buffer[0];
  const last = buffer[buffer.length - 1];
  const text = buffer.map((u) => u.text).join(' ').trim();
  output.push({
    id: `seg-${output.length + 1}`,
    startMs: first.startMs,
    endMs: last.endMs,
    text,
    utteranceIds: buffer.map((u) => u.id),
    durationMs: Math.max(0, last.endMs - first.startMs),
    wordCount: wordCount(text),
  });
}

export function segmentTranscript(transcript: Transcript, options: SegmentationOptions = {}): ContentSegment[] {
  const config = { ...DEFAULTS, ...options };
  if (config.maxDurationMs <= 0 || config.maxWords <= 0 || config.pauseThresholdMs < 0) {
    throw new Error('SEGMENTATION_OPTIONS_INVALID');
  }

  const output: ContentSegment[] = [];
  let buffer: TranscriptUtterance[] = [];

  for (const utterance of transcript.utterances) {
    const previous = buffer.at(-1);
    const pause = previous ? utterance.startMs - previous.endMs : 0;
    const candidateText = [...buffer.map((u) => u.text), utterance.text].join(' ').trim();
    const candidateDuration = buffer.length ? utterance.endMs - buffer[0].startMs : utterance.endMs - utterance.startMs;
    const boundary = Boolean(
      previous && (pause >= config.pauseThresholdMs || candidateDuration > config.maxDurationMs || wordCount(candidateText) > config.maxWords),
    );

    if (boundary) {
      flush(buffer, output);
      buffer = [];
    }
    buffer.push(utterance);
  }

  flush(buffer, output);
  return output;
}

export function mergeShortSegments(segments: ContentSegment[], minimumDurationMs = 8_000): ContentSegment[] {
  if (minimumDurationMs < 0) throw new Error('MINIMUM_DURATION_INVALID');
  const merged: ContentSegment[] = [];
  for (const segment of segments) {
    const previous = merged.at(-1);
    if (previous && previous.durationMs < minimumDurationMs) {
      const text = `${previous.text} ${segment.text}`.trim();
      const combined = { ...previous, endMs: segment.endMs, text, durationMs: segment.endMs - previous.startMs, utteranceIds: [...previous.utteranceIds, ...segment.utteranceIds], wordCount: wordCount(text) };
      merged[merged.length - 1] = combined;
    } else {
      merged.push({ ...segment });
    }
  }
  return merged.map((segment, index) => ({ ...segment, id: `seg-${index + 1}` }));
}
