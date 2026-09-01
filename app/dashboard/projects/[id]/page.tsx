import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import RenderProject from './render-project';

export default async function ProjectPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params; const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) return null;
 const {data:project}=await supabase.from('projects').select('id,name,status,format,start_seconds,end_seconds,output_path,created_at').eq('id',id).eq('user_id',user.id).maybeSingle();
 if(!project) notFound();
 return <RenderProject project={project} />;
}
