export type SilenceRange = {
  start: number;
  end: number;
};

export type ClipContextInput = {
  transcript: string;
  startSeconds: number;
  endSeconds: number;
  sceneChanges?: number[];
  silenceRanges?: SilenceRange[];
  speakerChanges?: number[];
};

export type ClipContext = {
  transcript: string;
  durationSeconds: number;
  sceneChangeRate: number;
  silenceRatio: number;
  speakerChangeRate: number;
};

function finite(value: number): boolean {
  return Number.isFinite(value);
}

function normalizeEvents(events: number[] | undefined, start: number, end: number): number[] {
  if (!events || end <= start) return [];
  return events.filter((event) => finite(event) && event >= start && event <= end);
}

function getSilenceSeconds(ranges: SilenceRange[] | undefined, start: number, end: number): number {
  if (!ranges || end <= start) return 0;

  return ranges.reduce((total, range) => {
    if (!finite(range.start) || !finite(range.end) || range.end <= range.start) return total;
    const overlapStart = Math.max(start, range.start);
    const overlapEnd = Math.min(end, range.end);
    return overlapEnd > overlapStart ? total + overlapEnd - overlapStart : total;
  }, 0);
}

export function analyzeClipContext(input: ClipContextInput): ClipContext {
  const start = finite(input.startSeconds) ? Math.max(0, input.startSeconds) : 0;
  const rawEnd = finite(input.endSeconds) ? Math.max(0, input.endSeconds) : start;
  const end = Math.max(start, rawEnd);
  const durationSeconds = end - start;

  if (durationSeconds === 0) {
    return {
      transcript: input.transcript.trim().replace(/\s+/g, ' '),
      durationSeconds: 0,
      sceneChangeRate: 0,
      silenceRatio: 0,
      speakerChangeRate: 0,
    };
  }

  const sceneChanges = normalizeEvents(input.sceneChanges, start, end);
  const speakerChanges = normalizeEvents(input.speakerChanges, start, end);
  const silenceSeconds = Math.min(durationSeconds, getSilenceSeconds(input.silenceRanges, start, end));

  return {
    transcript: input.transcript.trim().replace(/\s+/g, ' '),
    durationSeconds,
    sceneChangeRate: sceneChanges.length / durationSeconds,
    silenceRatio: silenceSeconds / durationSeconds,
    speakerChangeRate: speakerChanges.length / durationSeconds,
  };
}
