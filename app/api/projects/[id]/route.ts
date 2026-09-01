import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getBearerToken, getMobileUser } from '@/lib/auth/mobile-request';
import { noStoreHeaders, sameOrigin } from '@/lib/security/request';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const isMobile = Boolean(getBearerToken(request));
  if (!isMobile && !sameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403, headers: noStoreHeaders() });

  const mobileUser = isMobile ? await getMobileUser(request) : null;
  const supabase = mobileUser?.client ?? await createClient();
  const user = mobileUser?.user ?? (await supabase.auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });

  const { id } = await params;
  const { data: project, error } = await supabase.from('projects').select('id,name,status,format,start_seconds,end_seconds,output_path,created_at,updated_at,edit_mode,subtitle_style,viral_score').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Gagal mengambil project.' }, { status: 500, headers: noStoreHeaders() });
  if (!project) return NextResponse.json({ error: 'Project tidak ditemukan.' }, { status: 404, headers: noStoreHeaders() });

  const admin = createAdminClient();
  const { data: job } = await admin.from('jobs').select('id,status,progress,error_code,error_message,attempts,created_at,updated_at,completed_at,failed_at').eq('project_id', id).eq('user_id', user.id).maybeSingle();
  return NextResponse.json({ project, job }, { headers: noStoreHeaders() });
}
