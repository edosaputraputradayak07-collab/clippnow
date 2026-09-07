import type { SubtitleCue, SubtitlePlan, SubtitlePosition, SubtitleStyle } from './subtitle-plan';

export type AssRenderOptions = {
  width: number;
  height: number;
  fontFamily?: string;
  fontSize?: number;
};

const alignment: Record<SubtitlePosition, number> = { top: 8, center: 5, bottom: 2 };
const styleDefaults: Record<SubtitleStyle, { primary: string; outline: string; bold: number; outlineWidth: number }> = {
  'bold-pop': { primary: '&H00FFFFFF', outline: '&H00000000', bold: 1, outlineWidth: 4 },
  karaoke: { primary: '&H00FFFFFF', outline: '&H00000000', bold: 1, outlineWidth: 3 },
  clean: { primary: '&H00FFFFFF', outline: '&H00000000', bold: 0, outlineWidth: 2 },
};

function assTime(seconds: number): string {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const totalCentiseconds = Math.floor(safe * 100);
  const hours = Math.floor(totalCentiseconds / 360000);
  const minutes = Math.floor((totalCentiseconds % 360000) / 6000);
  const secs = Math.floor((totalCentiseconds % 6000) / 100);
  const cs = totalCentiseconds % 100;
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

function escapeAssText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}');
}

function wordDurationCentiseconds(startSeconds: number, endSeconds: number): number {
  return Math.max(1, Math.round((endSeconds - startSeconds) * 100));
}

function cueText(cue: SubtitleCue): string {
  return cue.words.map((word) => {
    const text = escapeAssText(word.text);
    const highlight = word.highlight ? `\\c&H00FFFF&${text}\\c` : text;
    if (cue.style === 'karaoke') return `{\\k${wordDurationCentiseconds(word.startSeconds, word.endSeconds)}}${highlight}`;
    if (cue.style === 'bold-pop') return `{\\b1}${highlight}{\\b0}`;
    return highlight;
  }).join(' ');
}

function styleLine(cue: SubtitleCue, options: AssRenderOptions): string {
  const style = styleDefaults[cue.style];
  const fontSize = options.fontSize ?? (cue.style === 'clean' ? 48 : 58);
  return `Style: ${cue.style},${options.fontFamily ?? 'Arial'},${fontSize},${style.primary},&H0000FFFF,${style.outline},&H80000000,${style.bold},0,0,0,100,100,0,0,1,${style.outlineWidth},1,${alignment[cue.safeZone]},80,80,140,1`;
}

export function subtitlePlanToAss(plan: SubtitlePlan, options: AssRenderOptions): string {
  if (!Number.isFinite(options.width) || options.width <= 0 || !Number.isFinite(options.height) || options.height <= 0) {
    throw new Error('Invalid ASS render dimensions.');
  }

  const cuesByStyleAndPosition = new Map<string, SubtitleCue>();
  for (const cue of plan.cues) cuesByStyleAndPosition.set(`${cue.style}:${cue.safeZone}`, cue);

  const styles = [...cuesByStyleAndPosition.values()].map((cue) => styleLine(cue, options));
  const uniqueStyles = [...new Set(styles)];
  const lines = [
    '[Script Info]',
    'ScriptType: v4.00+',
    `PlayResX: ${Math.round(options.width)}`,
    `PlayResY: ${Math.round(options.height)}`,
    'ScaledBorderAndShadow: yes',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    ...uniqueStyles,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ];

  for (const cue of plan.cues) {
    const text = cueText(cue);
    if (text) lines.push(`Dialogue: 0,${assTime(cue.startSeconds)},${assTime(cue.endSeconds)},${cue.style},,0,0,0,,${text}`);
  }

  if (plan.hook) {
    lines.push(`Dialogue: 1,${assTime(plan.hook.startSeconds)},${assTime(plan.hook.endSeconds)},${plan.cues[0]?.style ?? 'bold-pop'},,0,0,0,,{\\b1}${escapeAssText(plan.hook.text)}{\\b0}`);
  }

  return `${lines.join('\n')}\n`;
}
