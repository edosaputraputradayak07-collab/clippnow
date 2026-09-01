import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { noStoreHeaders, sameOrigin } from '@/lib/security/request';
import { processJob } from '@/worker/render-worker';

export const runtime='nodejs';
export const maxDuration=300;

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
  if(!sameOrigin(request)) return NextResponse.json({error:'Invalid request origin.'},{status:403,headers:noStoreHeaders()});
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
  if(!user) return NextResponse.json({error:'Unauthorized'},{status:401,headers:noStoreHeaders()});
  const {id}=await params;
  const admin=createAdminClient();
  const {data:job,error}=await admin.from('jobs').select('id,status').eq('project_id',id).eq('user_id',user.id).maybeSingle();
  if(error || !job) return NextResponse.json({error:'Render job tidak ditemukan.'},{status:404,headers:noStoreHeaders()});
  if(job.status==='completed') return NextResponse.json({status:'completed'},{headers:noStoreHeaders()});
  if(job.status==='processing') return NextResponse.json({status:'processing'},{status:202,headers:noStoreHeaders()});
  try{
    await processJob(job.id);
    const {data:project}=await admin.from('projects').select('output_path,status').eq('id',id).eq('user_id',user.id).single();
    if(!project?.output_path || project.status!=='completed') throw new Error('render_output_missing');
    const {data:signed,error:signedError}=await admin.storage.from('clippnow-videos').createSignedUrl(project.output_path,300);
    if(signedError || !signed?.signedUrl) throw new Error('signed_output_failed');
    return NextResponse.json({status:'completed',url:signed.signedUrl,expires_in:300},{headers:noStoreHeaders()});
  }catch{
    return NextResponse.json({status:'failed',error:'Video gagal diproses. Coba lagi.'},{status:500,headers:noStoreHeaders()});
  }
}
