import { createAdminClient } from '@/lib/supabase/admin';
import { createWriteStream, createReadStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { Readable } from 'node:stream';
import path from 'node:path';

const BUCKET='clippnow-videos';
export async function downloadPrivateVideo(sourcePath:string,targetPath:string){
  const admin=createAdminClient();
  const {data,error}=await admin.storage.from(BUCKET).download(sourcePath);
  if(error || !data) throw new Error('source_download_failed');
  await mkdir(path.dirname(targetPath),{recursive:true});
  const stream=Readable.fromWeb(data.stream() as ReadableStream<Uint8Array>);
  await new Promise<void>((resolve,reject)=>{ const out=createWriteStream(targetPath); stream.pipe(out); out.on('finish',resolve); out.on('error',reject); stream.on('error',reject); });
}
export async function uploadPrivateVideo(outputPath:string,storagePath:string){
  const admin=createAdminClient();
  const {error}=await admin.storage.from(BUCKET).upload(storagePath,createReadStream(outputPath),{contentType:'video/mp4',upsert:false});
  if(error) throw new Error('output_upload_failed');
}
