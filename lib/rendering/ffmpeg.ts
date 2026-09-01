import type { RenderFormat } from './types';

export interface FfmpegInput {
  sourcePath: string;
  outputPath: string;
  startSeconds: number;
  durationSeconds: number;
  format: RenderFormat;
  subtitlePath?: string;
  effects?: string[];
}

const SIZE: Record<RenderFormat, string> = { '9:16': '1080:1920', '1:1': '1080:1080', '16:9': '1920:1080' };

function escapeSubtitlePath(value: string) {
  return value.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");
}

export function buildFfmpegArgs(input: FfmpegInput): string[] {
  if (!Number.isFinite(input.startSeconds) || input.startSeconds < 0) throw new Error('Invalid start time');
  if (!Number.isFinite(input.durationSeconds) || input.durationSeconds <= 0) throw new Error('Invalid duration');
  const size = SIZE[input.format];
  if (!size) throw new Error('Invalid format');

  const filters = [`scale=${size}:force_original_aspect_ratio=decrease`, `pad=${size}:(ow-iw)/2:(oh-ih)/2`, 'setsar=1'];
  const effects = input.effects ?? [];
  if (effects.includes('motion-zoom')) filters.push(`zoompan=z='min(zoom+0.0005,1.08)':d=1:s=${size}:fps=30`);
  if (effects.includes('impact-shake')) filters.push('eq=contrast=1.08:saturation=1.12');
  if (input.subtitlePath) filters.push(`subtitles=${escapeSubtitlePath(input.subtitlePath)}`);

  return [
    '-hide_banner','-loglevel','error','-ss',String(input.startSeconds),'-i',input.sourcePath,'-t',String(input.durationSeconds),
    '-map','0:v:0?','-map','0:a:0?','-vf',filters.join(','),'-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p',
    '-c:a','aac','-b:a','160k','-movflags','+faststart','-progress','pipe:1','-nostats','-y',input.outputPath,
  ];
}
