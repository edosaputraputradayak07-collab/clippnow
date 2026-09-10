export type ViralEditorFormat = '9:16' | '1:1' | '16:9';
export type ViralEditorSubtitleStyle = 'viral-punch' | 'clean' | 'karaoke' | 'neon' | 'cinematic' | 'bold-pop';
export type ViralEditorPunchIn = { start: number; end: number; strength: 'medium' | 'strong' };

export const VIRAL_EDITOR_EFFECTS = ['motion-zoom', 'impact-shake', 'beat-flash', 'jump-cut', 'clean-cut'] as const;

export type ViralEditorControlsInput = {
  format?: unknown;
  subtitleStyle?: unknown;
  effects?: unknown;
  punchIns?: unknown;
  duration: number;
};

export type ViralEditorControls = {
  format: ViralEditorFormat;
  subtitleStyle: ViralEditorSubtitleStyle;
  effects: string[];
  punchIns: ViralEditorPunchIn[];
};

const FORMATS: ViralEditorFormat[] = ['9:16', '1:1', '16:9'];
const SUBTITLE_STYLES: ViralEditorSubtitleStyle[] = ['viral-punch', 'clean', 'karaoke', 'neon', 'cinematic', 'bold-pop'];

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function sanitizeViralEditorControls(input: ViralEditorControlsInput): ViralEditorControls {
  const duration = Math.max(0, finite(input.duration) ? input.duration : 0);
  const format = FORMATS.includes(input.format as ViralEditorFormat) ? input.format as ViralEditorFormat : '9:16';
  const subtitleStyle = SUBTITLE_STYLES.includes(input.subtitleStyle as ViralEditorSubtitleStyle)
    ? input.subtitleStyle as ViralEditorSubtitleStyle
    : 'bold-pop';
  const effects = Array.isArray(input.effects)
    ? [...new Set(input.effects.filter((effect): effect is string => typeof effect === 'string' && VIRAL_EDITOR_EFFECTS.includes(effect as typeof VIRAL_EDITOR_EFFECTS[number])))]
    : [];
  const punchIns = Array.isArray(input.punchIns)
    ? input.punchIns
        .filter((item): item is { start: unknown; end: unknown; strength: unknown } => !!item && typeof item === 'object')
        .map(item => {
          const start = Math.max(0, Math.min(duration, finite(item.start) ? item.start : 0));
          const end = Math.max(0, Math.min(duration, finite(item.end) ? item.end : 0));
          return {
            start,
            end,
            strength: item.strength === 'strong' ? 'strong' as const : 'medium' as const,
          };
        })
        .filter(item => item.end > item.start)
        .slice(0, 12)
    : [];

  return { format, subtitleStyle, effects, punchIns };
}
