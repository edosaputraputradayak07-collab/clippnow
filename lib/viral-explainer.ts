export type ViralExplainerFormat = '9:16' | '1:1' | '16:9';

export type TranscriptCue = {
  start: number;
  end: number;
  text: string;
};

type PlanOptions = {
  duration: number;
  maxClips?: number;
  format?: ViralExplainerFormat;
};

export type ViralExplainerPlan = {
  format: ViralExplainerFormat;
  hook?: TranscriptCue;
  emphasis: TranscriptCue[];
  cta?: TranscriptCue;
  subtitleStyle: 'dynamic-highlight';
  punchIns: Array<{ start: number; end: number; strength: 'medium' | 'strong' }>;
  reframe: { mode: 'face-priority' | 'center'; format: ViralExplainerFormat };
  clips: Array<{ start: number; end: number; reason: 'explainer' | 'highlight' }>;
};

const HOOK_TERMS = [
  'pov', 'best', 'single', 'secret', 'why', 'how', 'mistake', 'truth', 'you need', 'stop',
  'this is', 'here is', "here's", 'the easiest', 'the fastest',
];

const CTA_TERMS = [
  'try it', 'start now', 'follow', 'subscribe', 'comment', 'share', 'save this', 'today', 'link in bio',
];

const EMPHASIS_TERMS = [
  'first', 'then', 'step', 'important', 'because', 'best', 'secret', 'automatically', 'result', 'mistake',
];

function normalized(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function scoreCue(cue: TranscriptCue, terms: string[]) {
  const text = normalized(cue.text);
  return terms.reduce((score, term) => score + (text.includes(term) ? 2 : 0), 0);
}

function clampCue(cue: TranscriptCue, duration: number): TranscriptCue {
  return {
    ...cue,
    start: Math.max(0, Math.min(cue.start, duration)),
    end: Math.max(0, Math.min(Math.max(cue.end, cue.start), duration)),
  };
}

export function buildViralExplainerPlan(cues: TranscriptCue[], options: PlanOptions): ViralExplainerPlan {
  const duration = Math.max(0, Number.isFinite(options.duration) ? options.duration : 0);
  const format = options.format ?? '9:16';
  const maxClips = Math.max(1, Math.min(10, Math.floor(options.maxClips ?? 1)));
  const safeCues = cues
    .filter((cue) => Number.isFinite(cue.start) && Number.isFinite(cue.end) && cue.end > cue.start && cue.text.trim())
    .sort((a, b) => a.start - b.start)
    .map((cue) => clampCue(cue, duration));

  if (safeCues.length === 0 || duration === 0) {
    return {
      format,
      emphasis: [],
      subtitleStyle: 'dynamic-highlight',
      punchIns: [],
      reframe: { mode: format === '16:9' ? 'center' : 'face-priority', format },
      clips: [],
    };
  }

  const early = safeCues.filter((cue) => cue.start <= Math.min(12, duration));
  const hook = [...early].sort((a, b) => {
    const scoreDelta = scoreCue(b, HOOK_TERMS) - scoreCue(a, HOOK_TERMS);
    return scoreDelta || a.start - b.start;
  })[0] ?? safeCues[0];

  const ctaCandidates = safeCues.filter((cue) => cue.start >= Math.max(0, duration - 12));
  const cta = [...ctaCandidates].sort((a, b) => {
    const scoreDelta = scoreCue(b, CTA_TERMS) - scoreCue(a, CTA_TERMS);
    return scoreDelta || b.start - a.start;
  })[0];

  const emphasis = safeCues
    .filter((cue) => cue !== hook && cue !== cta)
    .map((cue, index) => ({ cue, score: scoreCue(cue, EMPHASIS_TERMS) + Math.max(0, 3 - index * 0.25) }))
    .sort((a, b) => b.score - a.score || a.cue.start - b.cue.start)
    .slice(0, 4)
    .map(({ cue }) => cue)
    .sort((a, b) => a.start - b.start);

  const selected = [hook, ...emphasis, ...(cta ? [cta] : [])].sort((a, b) => a.start - b.start);
  const lastSelectedEnd = selected.reduce((end, cue) => Math.max(end, cue.end), hook.end);
  const clipEnd = Math.min(duration, Math.max(lastSelectedEnd + 1.5, Math.min(duration, hook.start + 45)));

  const clips = [
    { start: hook.start, end: clipEnd, reason: 'explainer' as const },
    ...emphasis.slice(0, Math.max(0, maxClips - 1)).map((cue) => ({
      start: Math.max(0, cue.start - 1.2),
      end: Math.min(duration, cue.end + 1.8),
      reason: 'highlight' as const,
    })),
  ]
    .filter((clip) => clip.end > clip.start)
    .slice(0, maxClips);

  const punchIns = selected.map((cue) => ({
    start: cue.start,
    end: Math.min(duration, cue.end),
    strength: cue === hook ? 'strong' as const : 'medium' as const,
  }));

  return {
    format,
    hook,
    emphasis,
    cta,
    subtitleStyle: 'dynamic-highlight',
    punchIns,
    reframe: { mode: format === '16:9' ? 'center' : 'face-priority', format },
    clips,
  };
}
