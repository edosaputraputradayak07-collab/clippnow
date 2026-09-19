import type { RenderPlan } from './render-plan';

export type FFmpegCommand = { executable: string; args: string[] };

function escapeFilterText(value: string): string { return value.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'").replace(/\n/g, ' '); }

export function buildFFmpegCommand(plan: RenderPlan, ffmpegPath = 'ffmpeg'): FFmpegCommand {
  const durationSeconds = ((plan.endMs - plan.startMs) / 1000).toFixed(3);
  const args = ['-hide_banner', '-loglevel', 'error', '-y', '-ss', (plan.startMs / 1000).toFixed(3), '-i', plan.sourcePath, '-t', durationSeconds, '-vf', `scale=${plan.width}:${plan.height}:force_original_aspect_ratio=decrease,pad=${plan.width}:${plan.height}:(ow-iw)/2:(oh-ih)/2${plan.caption.enabled ? `,drawtext=text='${escapeFilterText(plan.caption.text)}':x=(w-text_w)/2:y=h-180:fontsize=42:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=18` : ''}`, '-c:v', plan.videoCodec, '-c:a', plan.audioCodec, '-movflags', '+faststart', plan.outputPath];
  return { executable: ffmpegPath, args };
}

export interface FFmpegExecutor { execute(command: FFmpegCommand): Promise<void> }
