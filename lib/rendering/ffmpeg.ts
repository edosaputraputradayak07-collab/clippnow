import type { RenderFormat } from './types';

export interface FfmpegInput {
  sourcePath: string;
  outputPath: string;
  startSeconds: number;
  durationSeconds: number;
  format: RenderFormat;
  subtitlePath?: string;
  effects?: string[];
  normalizeAudio?: boolean;
  punchIns?: Array<{ start: number; end: number; strength: 'medium' | 'strong' }>;
}

const SIZE: Record<RenderFormat, string> = { '9:16': '1080:1920', '1:1': '1080:1080', '16:9': '1920:1080' };

function escapeSubtitlePath(value: string) {
  return value.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");
}

function punchInScaleExpression(punchIns: NonNullable<FfmpegInput['punchIns']>) {
  const safe = punchIns
    .filter((item) => Number.isFinite(item.start) && Number.isFinite(item.end) && item.end > item.start)
    .slice(0, 12);
  if (!safe.length) return null;

  return safe.reduceRight((expression, item) => {
    const start = Math.max(0, item.start);
    const end = Math.max(start, item.end);
    const scale = item.strength === 'strong' ? 0.82 : 0.9;
    return `if(between(t,${start},${end}),${scale},${expression})`;
  }, '1');
}

function motionZoomCropExpression(durationSeconds: number) {
  const duration = Math.max(0.1, durationSeconds);
  return `crop=w='iw/(1+0.08*min(t/${duration},1))':h='ih/(1+0.08*min(t/${duration},1))':x='(iw-ow)/2':y='(ih-oh)/2'`;
}

export function buildFfmpegArgs(input: FfmpegInput): string[] {
  if (!Number.isFinite(input.startSeconds) || input.startSeconds < 0) throw new Error('Invalid start time');
  if (!Number.isFinite(input.durationSeconds) || input.durationSeconds <= 0) throw new Error('Invalid duration');
  const size = SIZE[input.format];
  if (!size) throw new Error('Invalid format');

  const filters: string[] = [];
  const punchExpression = punchInScaleExpression(input.punchIns ?? []);
  const effects = new Set(input.effects ?? []);

  if (punchExpression) {
    filters.push(`crop=w='iw*${punchExpression}':h='ih*${punchExpression}':x='(iw-ow)/2':y='(ih-oh)/2'`);
  } else if (effects.has('motion-zoom')) {
    filters.push(motionZoomCropExpression(input.durationSeconds));
  }
  filters.push(`scale=${size}:force_original_aspect_ratio=decrease`, `pad=${size}:(ow-iw)/2:(oh-ih)/2`, 'setsar=1');

  if (effects.has('motion-zoom') && punchExpression) filters.push(motionZoomCropExpression(input.durationSeconds));
  if (effects.has('impact-shake')) filters.push('eq=contrast=1.08:saturation=1.12');
  if (effects.has('beat-flash')) filters.push("eq=brightness='if(lt(mod(t,1.25),0.08),0.10,0)'");
  if (effects.has('jump-cut')) filters.push('unsharp=5:5:0.55:5:5:0');
  if (effects.has('clean-cut')) filters.push('unsharp=5:5:0.35:5:5:0');
  if (input.subtitlePath) filters.push(`subtitles=${escapeSubtitlePath(input.subtitlePath)}`);

  return [
    '-hide_banner','-loglevel','error','-ss',String(input.startSeconds),'-i',input.sourcePath,'-t',String(input.durationSeconds),
    '-map','0:v:0?','-map','0:a:0?','-vf',filters.join(','),
    ...(input.normalizeAudio ? ['-af','loudnorm=I=-14:TP=-1.5:LRA=11'] : []),
    '-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p',
    '-c:a','aac','-b:a','160k','-movflags','+faststart','-progress','pipe:1','-nostats','-y',input.outputPath,
  ];
}
