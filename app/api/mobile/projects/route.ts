import { NextResponse } from 'next/server';
import { getMobileUser } from '@/lib/auth/mobile-request';
import { createAdminClient } from '@/lib/supabase/admin';
import { noStoreHeaders } from '@/lib/security/request';

export async function GET(request: Request) {
  const context = await getMobileUser(request);
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });

  const { data: projects, error } = await context.client
    .from('projects')
    .select('id,name,status,format,start_seconds,end_seconds,created_at,updated_at')
    .eq('user_id', context.user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: 'Gagal mengambil project.' }, { status: 500, headers: noStoreHeaders() });
  if (!projects?.length) return NextResponse.json({ projects: [] }, { headers: noStoreHeaders() });

  const admin = createAdminClient();
  const ids = projects.map((project) => project.id);
  const { data: jobs } = await admin
    .from('jobs')
    .select('id,project_id,status,progress,error_code,attempts,created_at,updated_at,completed_at,failed_at')
    .eq('user_id', context.user.id)
    .in('project_id', ids);

  const jobsByProject = new Map((jobs ?? []).map((job) => [job.project_id, job]));
  return NextResponse.json(
    { projects: projects.map((project) => ({ project, job: jobsByProject.get(project.id) ?? null })) },
    { headers: noStoreHeaders() },
  );
}
