import type { RenderFormat } from './types';

export interface FfmpegInput { sourcePath:string; outputPath:string; startSeconds:number; durationSeconds:number; format:RenderFormat; }
const SIZE: Record<RenderFormat,string> = {'9:16':'1080:1920','1:1':'1080:1080','16:9':'1920:1080'};
export function buildFfmpegArgs(input:FfmpegInput): string[] {
  if (!Number.isFinite(input.startSeconds) || input.startSeconds < 0) throw new Error('Invalid start time');
  if (!Number.isFinite(input.durationSeconds) || input.durationSeconds <= 0) throw new Error('Invalid duration');
  const size=SIZE[input.format];
  if (!size) throw new Error('Invalid format');
  return ['-hide_banner','-loglevel','error','-ss',String(input.startSeconds),'-i',input.sourcePath,'-t',String(input.durationSeconds),'-map','0:v:0?','-map','0:a:0?','-vf',`scale=${size}:force_original_aspect_ratio=decrease,pad=${size}:(ow-iw)/2:(oh-ih)/2,setsar=1`,'-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart','-progress','pipe:1','-nostats','-y',input.outputPath];
}
