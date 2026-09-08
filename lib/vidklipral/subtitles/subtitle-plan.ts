export type SubtitleStyle = 'bold-pop' | 'karaoke' | 'clean';
export type SubtitlePosition = 'top' | 'center' | 'bottom';

export type SubtitleWord = {
  startSeconds: number;
  endSeconds: number;
  text: string;
  highlight?: boolean;
};

export type SubtitleCue = {
  startSeconds: number;
  endSeconds: number;
  words: SubtitleWord[];
  style: SubtitleStyle;
  safeZone: SubtitlePosition;
};

export type SubtitlePlan = {
  cues: SubtitleCue[];
  hook?: { text: string; startSeconds: number; endSeconds: number };
};

export type SubtitlePlanOptions = {
  style?: SubtitleStyle;
  position?: SubtitlePosition;
  maxWordsPerCue?: number;
  keywords?: string[];
  hook?: { text: string; startSeconds: number; endSeconds: number };
};

const finite = (value: number) => Number.isFinite(value);

function normalizeWord(word: SubtitleWord): SubtitleWord | null {
  if (typeof word.text !== 'string' || !word.text.trim()) return null;
  if (!finite(word.startSeconds) || !finite(word.endSeconds)) return null;

  const start = Math.max(0, word.startSeconds);
  const end = Math.max(start, word.endSeconds);
  if (end <= start) return null;

  return { startSeconds: start, endSeconds: end, text: word.text.trim() };
}

function normalizeHook(hook: SubtitlePlanOptions['hook']) {
  if (!hook || typeof hook.text !== 'string' || !hook.text.trim()) return undefined;
  if (!finite(hook.startSeconds) || !finite(hook.endSeconds)) return undefined;
  const startSeconds = Math.max(0, hook.startSeconds);
  const endSeconds = Math.max(startSeconds, hook.endSeconds);
  if (endSeconds <= startSeconds) return undefined;
  return { text: hook.text.trim(), startSeconds, endSeconds };
}

export function buildSubtitlePlan(words: SubtitleWord[], options: SubtitlePlanOptions = {}): SubtitlePlan {
  const style = options.style ?? 'bold-pop';
  const position = options.position ?? 'bottom';
  const maxWordsPerCue = Math.max(1, Math.floor(options.maxWordsPerCue ?? 5));
  const keywords = new Set((options.keywords ?? []).map((keyword) => keyword.trim().toLocaleLowerCase()).filter(Boolean));

  const normalized = words
    .map(normalizeWord)
    .filter((word): word is SubtitleWord => Boolean(word))
    .sort((a, b) => a.startSeconds - b.startSeconds);

  const highlighted = normalized.map((word) => ({
    ...word,
    highlight: keywords.has(word.text.toLocaleLowerCase()),
  }));

  const cues: SubtitleCue[] = [];
  for (let index = 0; index < highlighted.length; index += maxWordsPerCue) {
    const cueWords = highlighted.slice(index, index + maxWordsPerCue);
    if (!cueWords.length) continue;
    cues.push({
      startSeconds: cueWords[0].startSeconds,
      endSeconds: cueWords[cueWords.length - 1].endSeconds,
      words: cueWords,
      style,
      safeZone: position,
    });
  }

  return { cues, hook: normalizeHook(options.hook) };
}
