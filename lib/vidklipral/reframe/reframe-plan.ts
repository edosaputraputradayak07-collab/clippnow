export type ReframeAspectRatio = '9:16' | '1:1' | '16:9' | '3:4';
export type ReframeMode = 'single' | 'split' | 'fit' | 'blur' | 'object';

export type ReframeSubject = {
  id: string;
  startSeconds: number;
  endSeconds: number;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  activeSpeaker?: boolean;
  kind?: 'person' | 'object';
};

export type ReframeCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ReframeSegment = {
  startSeconds: number;
  endSeconds: number;
  mode: ReframeMode;
  subjectIds: string[];
  crop: ReframeCrop;
};

export type ReframePlanOptions = {
  aspectRatio: ReframeAspectRatio;
  durationSeconds: number;
  sourceAspectRatio?: number;
  minConfidence?: number;
};

const ASPECTS: Record<ReframeAspectRatio, number> = {
  '9:16': 9 / 16,
  '1:1': 1,
  '16:9': 16 / 9,
  '3:4': 3 / 4,
};

function finite(value: number): boolean {
  return Number.isFinite(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeSubject(subject: ReframeSubject): ReframeSubject | null {
  if (!subject.id || !finite(subject.startSeconds) || !finite(subject.endSeconds)) return null;
  if (subject.endSeconds <= subject.startSeconds) return null;
  if (![subject.x, subject.y, subject.width, subject.height, subject.confidence].every(finite)) return null;
  if (subject.width <= 0 || subject.height <= 0) return null;

  return {
    ...subject,
    x: clamp(subject.x, 0, 1),
    y: clamp(subject.y, 0, 1),
    width: clamp(subject.width, 0.001, 1),
    height: clamp(subject.height, 0.001, 1),
    confidence: clamp(subject.confidence, 0, 1),
  };
}

function overlap(a: ReframeSubject, b: ReframeSubject): boolean {
  return a.startSeconds < b.endSeconds && b.startSeconds < a.endSeconds;
}

function makeCrop(subjects: ReframeSubject[], targetAspect: number, sourceAspect: number): ReframeCrop {
  if (subjects.length === 0) return { x: 0, y: 0, width: 1, height: 1 };

  const left = Math.min(...subjects.map((s) => s.x));
  const top = Math.min(...subjects.map((s) => s.y));
  const right = Math.max(...subjects.map((s) => s.x + s.width));
  const bottom = Math.max(...subjects.map((s) => s.y + s.height));
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;

  let width = 1;
  let height = 1;
  const normalizedSourceAspect = sourceAspect;

  if (targetAspect < normalizedSourceAspect) {
    width = clamp(targetAspect / normalizedSourceAspect, 0.05, 1);
  } else {
    height = clamp(normalizedSourceAspect / targetAspect, 0.05, 1);
  }

  const minX = width / 2;
  const minY = height / 2;
  const x = clamp(centerX, minX, 1 - minX) - minX;
  const y = clamp(centerY, minY, 1 - minY) - minY;

  return {
    x: clamp(x, 0, 1 - width),
    y: clamp(y, 0, 1 - height),
    width,
    height,
  };
}

export function buildReframePlan(
  inputSubjects: ReframeSubject[],
  options: ReframePlanOptions,
): ReframeSegment[] {
  const duration = finite(options.durationSeconds) ? Math.max(0, options.durationSeconds) : 0;
  if (duration === 0) return [];

  const minConfidence = clamp(options.minConfidence ?? 0.65, 0, 1);
  const sourceAspect = finite(options.sourceAspectRatio) && options.sourceAspectRatio! > 0
    ? options.sourceAspectRatio!
    : 16 / 9;
  const targetAspect = ASPECTS[options.aspectRatio];

  const subjects = inputSubjects
    .map(normalizeSubject)
    .filter((subject): subject is ReframeSubject => subject !== null)
    .filter((subject) => subject.confidence >= minConfidence)
    .filter((subject) => subject.startSeconds < duration && subject.endSeconds > 0)
    .map((subject) => ({
      ...subject,
      startSeconds: Math.max(0, subject.startSeconds),
      endSeconds: Math.min(duration, subject.endSeconds),
    }));

  const boundaries = Array.from(new Set([
    0,
    duration,
    ...subjects.flatMap((subject) => [subject.startSeconds, subject.endSeconds]),
  ])).sort((a, b) => a - b);

  const segments: ReframeSegment[] = [];

  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const startSeconds = boundaries[index];
    const endSeconds = boundaries[index + 1];
    if (endSeconds <= startSeconds) continue;

    const active = subjects.filter((subject) => subject.startSeconds < endSeconds && subject.endSeconds > startSeconds);
    const activeSpeakers = active.filter((subject) => subject.activeSpeaker && (subject.kind ?? 'person') === 'person');
    const people = active.filter((subject) => (subject.kind ?? 'person') === 'person');
    const chosen = activeSpeakers.length > 0 ? activeSpeakers : people;

    let mode: ReframeMode = 'fit';
    let subjectIds: string[] = [];
    let crop = makeCrop([], targetAspect, sourceAspect);

    if (chosen.length >= 2) {
      mode = 'split';
      subjectIds = chosen.slice(0, 2).sort((a, b) => a.x - b.x).map((subject) => subject.id);
      crop = makeCrop(chosen.slice(0, 2), targetAspect, sourceAspect);
    } else if (chosen.length === 1) {
      mode = 'single';
      subjectIds = [chosen[0].id];
      crop = makeCrop(chosen, targetAspect, sourceAspect);
    }

    const previous = segments[segments.length - 1];
    if (previous && previous.mode === mode && previous.subjectIds.join('|') === subjectIds.join('|')) {
      previous.endSeconds = endSeconds;
      continue;
    }

    segments.push({ startSeconds, endSeconds, mode, subjectIds, crop });
  }

  return segments;
}
