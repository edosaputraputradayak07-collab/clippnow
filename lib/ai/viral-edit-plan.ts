export type ViralGoal = 'tiktok' | 'instagram-reels' | 'youtube-shorts' | 'story' | 'podcast' | 'gaming' | 'music' | 'vlog' | 'education';
export type SubtitleStyle = 'viral-punch' | 'clean' | 'karaoke' | 'neon' | 'cinematic';

export interface TranscriptSegment { start: number; end: number; text: string; }
export interface ViralEditInput { durationSeconds: number; format: '9:16' | '1:1' | '16:9'; goal: ViralGoal; transcript: TranscriptSegment[]; }
export interface ViralEditPlan {
  score: number;
  hook: { startSeconds: number; endSeconds: number };
  clip: { startSeconds: number; endSeconds: number };
  subtitle: { style: SubtitleStyle; maxWordsPerLine: number };
  effects: string[];
  output: { width: number; height: number; fps: 30 | 60 };
}

const OUTPUTS: Record<ViralEditInput['format'], { width: number; height: number }> = {
  '9:16': { width: 1080, height: 1920 }, '1:1': { width: 1080, height: 1080 }, '16:9': { width: 1920, height: 1080 },
};

const HOOK_WORDS = /\b(rahasia|ternyata|jangan|cara|tips|kesalahan|bahaya|penting|terbaik|terburuk|kenapa|mengapa|how|why|secret|mistake|warning|shocking|before|after|viral|gratis|uang|cepat|mudah)\b/i;
const QUESTION = /[?]|\b(kenapa|mengapa|bagaimana|why|how|apa)\b/i;
const NUMBERS = /\b\d+(?:[.,]\d+)?\s*(?:x|%|kali|tahun|hari|menit|jam|rupiah|rb|ribu|juta)?\b/i;

function segmentScore(segment: TranscriptSegment, all: TranscriptSegment[], durationSeconds: number) {
  const text = segment.text.trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  const duration = Math.max(0.5, segment.end - segment.start);
  const density = Math.min(1, words / duration / 2.4);
  const hook = HOOK_WORDS.test(text) ? 18 : 0;
  const question = QUESTION.test(text) ? 10 : 0;
  const numbers = NUMBERS.test(text) ? 8 : 0;
  const position = segment.start < Math.min(12, durationSeconds * 0.2) ? 8 : 0;
  const followup = all.filter(s => s.start >= segment.end && s.start <= segment.end + 12).slice(0, 3).reduce((n, s) => n + s.text.split(/\s+/).filter(Boolean).length, 0);
  const continuity = Math.min(15, followup / 2);
  return Math.min(100, Math.round(42 + density * 20 + hook + question + numbers + position + continuity));
}

function buildPlanForSegment(input: ViralEditInput, winner: TranscriptSegment, winnerIndex: number, score: number): ViralEditPlan {
  const clipStart = Math.max(0, winner.start);
  const targetLength = input.format === '16:9' ? 45 : 35;
  let clipEnd = Math.min(input.durationSeconds, clipStart + targetLength);
  const nextSegments = input.transcript.slice(winnerIndex + 1);
  const naturalEnd = nextSegments.find(s => s.start >= clipStart + 18 && s.end <= clipStart + targetLength)?.end;
  if (naturalEnd) clipEnd = Math.min(input.durationSeconds, naturalEnd + 1.5);
  if (clipEnd - clipStart < 8) clipEnd = Math.min(input.durationSeconds, clipStart + Math.min(targetLength, 15));
  const hookEnd = Math.min(clipEnd, winner.end, winner.start + 3);
  const effects = input.goal === 'education' ? ['motion-zoom', 'beat-flash', 'clean-cut'] : ['motion-zoom', 'beat-flash', 'impact-shake', 'jump-cut'];
  return {
    score,
    hook: { startSeconds: winner.start, endSeconds: hookEnd },
    clip: { startSeconds: clipStart, endSeconds: clipEnd },
    subtitle: { style: input.goal === 'music' ? 'karaoke' : 'viral-punch', maxWordsPerLine: 5 },
    effects,
    output: { ...OUTPUTS[input.format], fps: input.format === '16:9' ? 30 : 60 },
  };
}

export function buildViralEditPlan(input: ViralEditInput): ViralEditPlan {
  if (!Number.isFinite(input.durationSeconds) || input.durationSeconds <= 0) throw new Error('duration_seconds_invalid');
  if (!input.transcript.length) return {
    score: 0, hook: { startSeconds: 0, endSeconds: 0 }, clip: { startSeconds: 0, endSeconds: input.durationSeconds },
    subtitle: { style: 'viral-punch', maxWordsPerLine: 5 }, effects: [], output: { ...OUTPUTS[input.format], fps: 30 },
  };
  const ranked = input.transcript.map((segment, index) => ({ segment, index, score: segmentScore(segment, input.transcript, input.durationSeconds) })).sort((a, b) => b.score - a.score || a.segment.start - b.segment.start);
  return buildPlanForSegment(input, ranked[0].segment, ranked[0].index, ranked[0].score);
}

export function buildViralEditPlans(input: ViralEditInput & { count?: number }): ViralEditPlan[] {
  if (!Number.isFinite(input.durationSeconds) || input.durationSeconds <= 0) throw new Error('duration_seconds_invalid');
  if (!input.transcript.length) return [buildViralEditPlan(input)];
  const requested = Math.min(10, Math.max(1, Math.floor(input.count ?? 5)));
  const ranked = input.transcript.map((segment, index) => ({ segment, index, score: segmentScore(segment, input.transcript, input.durationSeconds) })).sort((a, b) => b.score - a.score || a.segment.start - b.segment.start);
  const selected: ViralEditPlan[] = [];
  for (const candidate of ranked) {
    if (selected.length >= requested) break;
    const plan = buildPlanForSegment(input, candidate.segment, candidate.index, candidate.score);
    const overlaps = selected.some(existing => plan.clip.startSeconds < existing.clip.endSeconds && existing.clip.startSeconds < plan.clip.endSeconds);
    if (!overlaps) selected.push(plan);
  }
  return selected;
}
