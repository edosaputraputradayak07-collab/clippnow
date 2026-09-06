import type { TranscriptSegment } from './retention';

export type ClipWindow = {
  startSeconds: number;
  endSeconds: number;
};

function valid(segment: TranscriptSegment): boolean {
  return Number.isFinite(segment.startSeconds)
    && Number.isFinite(segment.endSeconds)
    && segment.endSeconds > segment.startSeconds;
}

export function chooseNaturalBoundaries(
  segments: TranscriptSegment[],
  requestedStartSeconds: number,
  requestedEndSeconds: number,
  snapDistanceSeconds = 1.5,
): ClipWindow | null {
  if (!Number.isFinite(requestedStartSeconds) || !Number.isFinite(requestedEndSeconds) || requestedEndSeconds <= requestedStartSeconds) {
    return null;
  }

  const normalized = segments.filter(valid).map((segment) => ({
    ...segment,
    startSeconds: Math.max(0, segment.startSeconds),
    endSeconds: Math.max(0, segment.endSeconds),
  })).filter((segment) => segment.endSeconds > segment.startSeconds);

  if (normalized.length === 0) return null;

  const starts = normalized.map((segment) => segment.startSeconds);
  const ends = normalized.map((segment) => segment.endSeconds);
  const nearest = (values: number[], target: number): number => values.reduce((best, value) =>
    Math.abs(value - target) < Math.abs(best - target) ? value : best,
  );

  const nearestStart = nearest(starts, requestedStartSeconds);
  const nearestEnd = nearest(ends, requestedEndSeconds);
  const start = Math.abs(nearestStart - requestedStartSeconds) <= snapDistanceSeconds
    ? nearestStart
    : requestedStartSeconds;
  const end = Math.abs(nearestEnd - requestedEndSeconds) <= snapDistanceSeconds
    ? nearestEnd
    : requestedEndSeconds;

  if (end <= start) return null;
  return {
    startSeconds: Number(start.toFixed(3)),
    endSeconds: Number(end.toFixed(3)),
  };
}
