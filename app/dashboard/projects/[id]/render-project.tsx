'use client';
import { useEffect, useState } from 'react';

type Project = { id:string; name:string; status:string; format:string; start_seconds:number; end_seconds:number; output_path:string|null; created_at:string };
type Plan = { score:number; subtitle:{style:string}; effects:string[]; clip?:{startSeconds:number;endSeconds:number} };

export default function RenderProject({project}:{project:Project}){
 const [status,setStatus]=useState(project.status); const [progress,setProgress]=useState(0); const [url,setUrl]=useState(''); const [error,setError]=useState(''); const [busy,setBusy]=useState(false); const [aiBusy,setAiBusy]=useState(false); const [plan,setPlan]=useState<Plan|null>(null);
 async function refresh(){ const r=await fetch(`/api/projects/${project.id}`,{cache:'no-store'}); const d=await r.json().catch(()=>({})); if(r.ok){setStatus(d.project?.status??status);setProgress(d.job?.progress??0);if(d.project?.status==='completed')await getOutput();} }
 async function getOutput(){const r=await fetch(`/api/projects/${project.id}/signed-output`,{cache:'no-store'});const d=await r.json().catch(()=>({}));if(r.ok)setUrl(d.url??'');}
 async function analyzeViral(){
  setAiBusy(true);setError('');
  try{
   const r=await fetch(`/api/projects/${project.id}/ai`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({goal:'tiktok',language:'id'})});
   const d=await r.json().catch(()=>({}));
   if(!r.ok){setError(d.error??'AI analysis gagal.');return false;}
   setPlan(d.plan??null);return Boolean(d.plan);
  }catch{setError('AI analysis gagal. Periksa koneksi lalu coba lagi.');return false;}
  finally{setAiBusy(false);}
 }
 async function makeViral(){await analyzeViral();}
 async function render(){
  if(busy||status==='processing')return;
  setBusy(true);setError('');
  try{
   let ready=Boolean(plan);
   if(!ready){ready=await analyzeViral();}
   if(!ready)return;
   setStatus('processing');setProgress(1);
   const r=await fetch(`/api/projects/${project.id}/render`,{method:'POST',headers:{'Content-Type':'application/json'}});
   const d=await r.json().catch(()=>({}));
   if(r.ok&&d.status==='completed'){setStatus('completed');setProgress(100);await getOutput();}
   else if(d.status==='processing'||d.status==='queued'){setStatus(d.status==='queued'?'queued':'processing');}
   else{setStatus('failed');setError(d.error??'Render gagal.');}
  }catch{setStatus('failed');setError('Render gagal. Periksa koneksi lalu coba lagi.');}
  finally{setBusy(false);}
 }
 useEffect(()=>{if(status==='completed'&&!url){void getOutput();return;}if(status==='processing'||status==='queued'){const timer=setInterval(()=>void refresh(),3000);return()=>clearInterval(timer);}},[status,url]);
 return <main className="min-h-screen bg-[#05070d] px-4 py-6 text-white sm:px-8"><div className="mx-auto max-w-4xl"><a href="/dashboard" className="text-xs font-bold text-slate-500 hover:text-white">← Dashboard</a><div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Creator Studio • AI Viral</div><h1 className="mt-2 text-3xl font-black">{project.name}</h1><p className="mt-2 text-sm text-slate-500">{project.format} • {Math.max(0,project.end_seconds-project.start_seconds).toFixed(1)} detik</p></div><span className="rounded-full border border-white/10 px-3 py-2 text-[10px] font-black uppercase text-slate-400">{status}</span></div>
 <div className="mt-7 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.04] p-5"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">One-tap editing</div><div className="mt-2 text-xl font-black">🔥 Buat Versi Viral Otomatis</div><p className="mt-1 text-sm text-slate-500">ClippNow otomatis menganalisis ucapan, memilih momen paling potensial, membuat subtitle, lalu menerapkan efek short-form.</p><div className="mt-4 flex flex-wrap gap-3"><button disabled={aiBusy||busy} onClick={makeViral} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-black text-white disabled:opacity-40">{aiBusy?'Menganalisis suara…':'Preview Analisis AI'}</button>{plan&&<span className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm font-black text-emerald-200">Viral Score {plan.score}/100</span>}</div>{plan&&<div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold text-slate-400"><span className="rounded-full border border-white/10 px-3 py-2">Subtitle: {plan.subtitle.style}</span>{plan.effects.map(effect=><span key={effect} className="rounded-full border border-white/10 px-3 py-2">{effect}</span>)}</div>}</div>
 {(status==='processing'||status==='queued')&&<div className="mt-8"><div className="flex justify-between text-xs font-bold text-slate-500"><span>Processing</span><span>{progress}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-300 transition-all" style={{width:`${progress}%`}} /></div></div>}{error&&<div className="mt-6 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-300">{error}</div>}{url&&status==='completed'?<div className="mt-8"><video src={url} controls playsInline className="max-h-[70vh] w-full rounded-2xl bg-black object-contain"/><div className="mt-4 flex flex-wrap gap-3"><a href={url} download className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950">Download MP4</a><button onClick={()=>navigator.share?.({title:project.name,url})} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-black text-white">Share</button></div></div>:<button disabled={busy||aiBusy||status==='processing'} onClick={render} className="mt-8 rounded-xl bg-cyan-300 px-6 py-3.5 text-sm font-black text-slate-950 disabled:opacity-40">{busy?'AI memilih momen & merender…':status==='failed'?'Buat ulang otomatis':'Buat video otomatis →'}</button>}</div></div></main>;
}
