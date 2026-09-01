import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import ffmpegPath from 'ffmpeg-static';
import { buildFfmpegArgs, type FfmpegInput } from './ffmpeg';
export interface RenderProgress { percent:number; outTimeSeconds:number; }
export async function renderClip(input:FfmpegInput,onProgress?:(p:RenderProgress)=>void):Promise<{outputPath:string}>{
  if(!ffmpegPath) throw new Error('FFmpeg binary unavailable');
  const executable:string=ffmpegPath;
  await mkdir(path.dirname(input.outputPath),{recursive:true});
  const args=buildFfmpegArgs(input);
  return new Promise((resolve,reject)=>{
    const child=spawn(executable,args,{shell:false,stdio:['ignore','pipe','pipe']});
    let progress=''; let stderr='';
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
    child.stdout.on('data',(chunk:string)=>{progress+=chunk;const lines=progress.split(/\r?\n/);progress=lines.pop()??'';let outTime=0,percent=0;for(const line of lines){const [key,val]=line.split('=');if(key==='out_time_us')outTime=Number(val)/1_000_000;else if(key==='progress'&&val==='end')percent=100;}if(outTime>0)percent=Math.min(99,Math.round(outTime/input.durationSeconds*100));onProgress?.({percent,outTimeSeconds:outTime});});
    child.stderr.on('data',(chunk:string)=>{stderr=(stderr+chunk).slice(-4000)});
    child.on('error',reject);
    child.on('close',(code:number|null)=>{if(code===0)resolve({outputPath:input.outputPath});else reject(new Error(`FFmpeg failed (${code}): ${stderr.replace(/\s+/g,' ').trim()}`))});
  });
}
