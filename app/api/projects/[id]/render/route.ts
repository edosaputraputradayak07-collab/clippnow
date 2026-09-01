import { NextResponse } from 'next/server';
import { start } from 'workflow/api';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getBearerToken, getMobileUser } from '@/lib/auth/mobile-request';
import { noStoreHeaders, sameOrigin } from '@/lib/security/request';
import { startRenderWorkflow } from '@/workflows/render-video';

export const runtime = 'nodejs';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const isMobile = Boolean(getBearerToken(request));
  if (!isMobile && !sameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403, headers: noStoreHeaders() });

  const mobileUser = isMobile ? await getMobileUser(request) : null;
  const supabase = mobileUser?.client ?? await createClient();
  const user = mobileUser?.user ?? (await supabase.auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });

  const { id } = await params;
  const admin = createAdminClient();
  const { data: job, error } = await admin.from('jobs').select('id,status').eq('project_id', id).eq('user_id', user.id).maybeSingle();
  if (error || !job) return NextResponse.json({ error: 'Render job tidak ditemukan.' }, { status: 404, headers: noStoreHeaders() });
  if (job.status === 'completed') return NextResponse.json({ status: 'completed' }, { headers: noStoreHeaders() });
  if (job.status === 'processing') return NextResponse.json({ status: 'processing' }, { status: 202, headers: noStoreHeaders() });

  try {
    const run = await start(startRenderWorkflow, [job.id]);
    return NextResponse.json({ status: 'queued', run_id: run.runId }, { status: 202, headers: noStoreHeaders() });
  } catch {
    return NextResponse.json({ status: 'failed', error: 'Render gagal dijadwalkan. Coba lagi.' }, { status: 500, headers: noStoreHeaders() });
  }
}
