import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import RenderProject from './render-project';
import ViralEditorControls from './viral-editor-controls';

type ViralPlan = {
 score: number;
 subtitle?: { style?: string };
 effects?: string[];
 punchIns?: Array<{ start: number; end: number; strength: 'medium' | 'strong' }>;
 hook?: { text?: string; start?: number; end?: number };
 emphasis?: Array<{ text?: string; start?: number; end?: number }>;
 cta?: { text?: string; start?: number; end?: number };
};

export default async function ProjectPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{batch?:string}>}){
 const {id}=await params; const {batch}=await searchParams; const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) return null;
 const {data:project}=await supabase.from('projects').select('id,name,status,format,start_seconds,end_seconds,output_path,created_at,edit_plan').eq('id',id).eq('user_id',user.id).maybeSingle();
 if(!project) notFound();
 const batchIds=typeof batch==='string'?batch.split(',').filter(Boolean).slice(0,10):[project.id];
 const plan=(project.edit_plan && typeof project.edit_plan === 'object') ? project.edit_plan as ViralPlan : null;
 return <>
  <RenderProject project={{id:project.id,name:project.name,status:project.status,format:project.format,start_seconds:project.start_seconds,end_seconds:project.end_seconds,output_path:project.output_path,created_at:project.created_at}} batchIds={batchIds.length?batchIds:[project.id]} />
  {!batch && <div className="mx-auto max-w-5xl px-4 pb-8 sm:px-8"><ViralEditorControls projectId={project.id} duration={Math.max(0,Number(project.end_seconds)-Number(project.start_seconds))} initialFormat={project.format as '9:16'|'1:1'|'16:9'} plan={plan} status={project.status} /></div>}
 </>;
}
