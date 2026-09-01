import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { noStoreHeaders, sameOrigin } from '@/lib/security/request';

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  if(!sameOrigin(request)) return NextResponse.json({error:'Invalid request origin.'},{status:403,headers:noStoreHeaders()});
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
  if(!user) return NextResponse.json({error:'Unauthorized'},{status:401,headers:noStoreHeaders()});
  const {id}=await params;
  const {data:project}=await supabase.from('projects').select('output_path,status').eq('id',id).eq('user_id',user.id).maybeSingle();
  if(!project) return NextResponse.json({error:'Project tidak ditemukan.'},{status:404,headers:noStoreHeaders()});
  if(project.status!=='completed' || !project.output_path) return NextResponse.json({error:'Video belum selesai.'},{status:409,headers:noStoreHeaders()});
  const admin=createAdminClient();
  const {data,error}=await admin.storage.from('clippnow-videos').createSignedUrl(project.output_path,300);
  if(error || !data?.signedUrl) return NextResponse.json({error:'Gagal membuat link video.'},{status:500,headers:noStoreHeaders()});
  return NextResponse.json({url:data.signedUrl,expires_in:300},{headers:noStoreHeaders()});
}
