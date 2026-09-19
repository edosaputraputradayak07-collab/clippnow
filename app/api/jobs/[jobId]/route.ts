import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../src/lib/auth';
import { createSupabaseServerClient } from '../../../../../src/lib/supabase/server';

type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  const { jobId } = await context.params;
  const supabase = await createSupabaseServerClient();
  const { data: job, error } = await supabase
    .from('jobs')
    .select('id,status,engine_status,error_details,progress,project_id')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'JOB_READ_FAILED' }, { status: 500 });
  if (!job) return NextResponse.json({ error: 'JOB_NOT_FOUND' }, { status: 404 });

  return NextResponse.json({
    id: job.id,
    projectId: job.project_id,
    status: job.status,
    engineStatus: job.engine_status,
    progress: job.progress ?? null,
    error: job.error_details?.message ?? null,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
