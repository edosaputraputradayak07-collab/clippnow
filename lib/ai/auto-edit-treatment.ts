import type { SubtitleStyle, ViralGoal } from './viral-edit-plan';

export interface AutoEditTreatmentInput {
  score: number;
  text: string;
  goal: ViralGoal;
}

export interface AutoEditTreatment {
  effects: string[];
  subtitleStyle: SubtitleStyle;
}

const STRONG_HOOK = /\b(rahasia|ternyata|jangan|bahaya|shocking|warning|secret|mistake|viral|before|after)\b/i;
const QUESTION = /[?]|\b(kenapa|mengapa|bagaimana|why|how|apa)\b/i;

export function chooseAutoEditTreatment({ score, text, goal }: AutoEditTreatmentInput): AutoEditTreatment {
  if (goal === 'education') {
    if (score >= 85 && (STRONG_HOOK.test(text) || QUESTION.test(text))) {
      return { effects: ['motion-zoom', 'clean-cut'], subtitleStyle: 'clean' };
    }
    return { effects: ['clean-cut'], subtitleStyle: 'clean' };
  }

  if (goal === 'music') {
    return {
      effects: score >= 82 ? ['motion-zoom', 'beat-flash'] : ['clean-cut'],
      subtitleStyle: 'karaoke',
    };
  }

  const strongHook = STRONG_HOOK.test(text) || QUESTION.test(text);
  if (score >= 85 && strongHook) {
    return {
      effects: ['motion-zoom', 'impact-shake', 'beat-flash', 'jump-cut'],
      subtitleStyle: 'viral-punch',
    };
  }

  if (score >= 70 || strongHook) {
    return {
      effects: ['motion-zoom', 'jump-cut'],
      subtitleStyle: 'viral-punch',
    };
  }

  return { effects: ['clean-cut'], subtitleStyle: 'clean' };
}
