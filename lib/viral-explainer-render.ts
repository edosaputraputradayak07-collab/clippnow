import type { TranscriptCue, ViralExplainerPlan } from './viral-explainer';

export type ViralExplainerRenderEditPlan = {
  effects: string[];
  subtitle: {
    style: 'bold-pop';
    position: 'bottom';
    keywords: string[];
    hook?: { text: string; startSeconds: number; endSeconds: number };
  };
  punchIns: Array<{ start: number; end: number; strength: 'medium' | 'strong' }>;
  reframe: { mode: 'face-priority' | 'center'; format: ViralExplainerPlan['format'] };
};

const KEYWORDS = [
  'pov', 'best', 'single', 'secret', 'why', 'how', 'mistake', 'truth', 'stop',
  'first', 'then', 'step', 'important', 'because', 'automatically', 'result',
  'try', 'follow', 'subscribe', 'comment', 'share', 'save', 'today',
];

function extractKeywords(cues: TranscriptCue[]) {
  const keywords: string[] = [];
  for (const cue of cues) {
    for (const token of cue.text.split(/\s+/)) {
      const clean = token.replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, '');
      if (!clean || !KEYWORDS.includes(clean.toLocaleLowerCase())) continue;
      if (!keywords.some((item) => item.toLocaleLowerCase() === clean.toLocaleLowerCase())) keywords.push(clean);
    }
  }
  return keywords.slice(0, 12);
}

export function viralExplainerPlanToEditPlan(plan: ViralExplainerPlan, cues: TranscriptCue[]): ViralExplainerRenderEditPlan {
  const hook = plan.hook
    ? { text: plan.hook.text, startSeconds: plan.hook.start, endSeconds: plan.hook.end }
    : undefined;

  return {
    effects: ['motion-zoom', 'jump-cut', 'clean-cut'],
    subtitle: {
      style: 'bold-pop',
      position: 'bottom',
      keywords: extractKeywords(cues),
      hook,
    },
    punchIns: plan.punchIns,
    reframe: plan.reframe,
  };
}
