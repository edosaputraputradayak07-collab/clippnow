export interface SubtitleWord { start: number; end: number; word: string }

function assTime(seconds: number) {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const centiseconds = Math.floor((safe % 60) * 100);
  const secs = Math.floor(centiseconds / 100);
  const cs = centiseconds % 100;
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

function escapeText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}');
}

export function buildAssSubtitles(words: SubtitleWord[], style: 'viral-punch' | 'clean' | 'karaoke' | 'neon' | 'cinematic' = 'viral-punch') {
  const styleMap = {
    'viral-punch': { font: 'Arial', size: 58, primary: '&H00FFFFFF', outline: '&H00000000', border: 4 },
    clean: { font: 'Arial', size: 48, primary: '&H00FFFFFF', outline: '&H00000000', border: 3 },
    karaoke: { font: 'Arial', size: 54, primary: '&H0000FFFF', outline: '&H00000000', border: 4 },
    neon: { font: 'Arial', size: 54, primary: '&H00FFFFFF', outline: '&H00FF00FF', border: 3 },
    cinematic: { font: 'Arial', size: 46, primary: '&H00FFFFFF', outline: '&H00000000', border: 2 },
  } as const;
  const s = styleMap[style];
  const lines: string[] = [
    '[Script Info]', 'ScriptType: v4.00+', 'PlayResX: 1080', 'PlayResY: 1920', 'ScaledBorderAndShadow: yes', '',
    '[V4+ Styles]', 'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: Viral,${s.font},${s.size},${s.primary},&H0000FFFF,${s.outline},&H80000000,1,0,0,0,100,100,0,0,1,${s.border},1,2,80,80,140,1`, '',
    '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ];

  const chunks: SubtitleWord[][] = [];
  for (const word of words) {
    if (!word.word.trim() || word.end <= word.start) continue;
    const current = chunks[chunks.length - 1];
    if (!current || current.length >= 5 || word.start - current[current.length - 1].end > 0.8) chunks.push([word]);
    else current.push(word);
  }

  for (const chunk of chunks) {
    const start = chunk[0].start;
    const end = chunk[chunk.length - 1].end;
    const text = chunk.map((word) => `{\\k${Math.max(1, Math.round((word.end - word.start) * 100))}}${escapeText(word.word.trim())}`).join(' ');
    lines.push(`Dialogue: 0,${assTime(start)},${assTime(end)},Viral,,0,0,0,,${text}`);
  }

  return `${lines.join('\n')}\n`;
}
