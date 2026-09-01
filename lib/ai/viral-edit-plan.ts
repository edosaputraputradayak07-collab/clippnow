export type ViralGoal = 'tiktok' | 'instagram-reels' | 'youtube-shorts' | 'story' | 'podcast' | 'gaming' | 'music' | 'vlog' | 'education';
export type SubtitleStyle = 'viral-punch' | 'clean' | 'karaoke' | 'neon' | 'cinematic';

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface ViralEditInput {
  durationSeconds: number;
  format: '9:16' | '1:1' | '16:9';
  goal: ViralGoal;
  transcript: TranscriptSegment[];
}

export interface ViralEditPlan {
  score: number;
  hook: { startSeconds: number; endSeconds: number };
  subtitle: { style: SubtitleStyle; maxWordsPerLine: number };
  effects: string[];
  output: { width: number; height: number; fps: 30 | 60 };
}

const OUTPUTS: Record<ViralEditInput['format'], { width: number; height: number }> = {
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '16:9': { width: 1920, height: 1080 },
};

function scoreTranscript(transcript: TranscriptSegment[], durationSeconds: number) {
  if (!transcript.length) return 0;
  const first = transcript[0];
  const hookLength = Math.max(0, Math.min(3, first.end - first.start));
  const earlySpeech = transcript.filter((segment) => segment.start < 5).length;
  const words = transcript.reduce((count, segment) => count + segment.text.trim().split(/\s+/).filter(Boolean).length, 0);
  const density = durationSeconds > 0 ? Math.min(1, words / durationSeconds / 2.2) : 0;
  return Math.min(100, Math.round(55 + hookLength * 8 + Math.min(15, earlySpeech * 4) + density * 22));
}

export function buildViralEditPlan(input: ViralEditInput): ViralEditPlan {
  if (!Number.isFinite(input.durationSeconds) || input.durationSeconds <= 0) {
    throw new Error('duration_seconds_invalid');
  }

  if (!input.transcript.length) {
    return {
      score: 0,
      hook: { startSeconds: 0, endSeconds: 0 },
      subtitle: { style: 'viral-punch', maxWordsPerLine: 5 },
      effects: [],
      output: { ...OUTPUTS[input.format], fps: 30 },
    };
  }

  const first = input.transcript[0];
  const hookEnd = Math.min(input.durationSeconds, Math.max(first.start, Math.min(first.end, first.start + 3)));
  const effects = input.goal === 'education' ? ['motion-zoom', 'beat-flash'] : ['motion-zoom', 'beat-flash', 'impact-shake'];

  return {
    score: scoreTranscript(input.transcript, input.durationSeconds),
    hook: { startSeconds: Math.max(0, first.start), endSeconds: hookEnd },
    subtitle: { style: 'viral-punch', maxWordsPerLine: 5 },
    effects,
    output: { ...OUTPUTS[input.format], fps: input.format === '16:9' ? 30 : 60 },
  };
}
