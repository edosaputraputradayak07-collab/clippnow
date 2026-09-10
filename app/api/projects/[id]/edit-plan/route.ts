import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getBearerToken, getMobileUser } from '@/lib/auth/mobile-request';
import { getClientIp, logSecurityEvent, securityGuard } from '@/lib/security/defense';
import { noStoreHeaders, sameOrigin } from '@/lib/security/request';
import { sanitizeViralEditorControls } from '@/lib/viral-editor-controls';

export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const isMobile = Boolean(getBearerToken(request));
  if (!isMobile && !sameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403, headers: noStoreHeaders() });
  const mobileUser = isMobile ? await getMobileUser(request) : null;
  const supabase = mobileUser?.client ?? await createClient();
  const user = mobileUser?.user ?? (await supabase.auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });
  const { id } = await params;
  const { data, error } = await supabase.from('projects').select('id,format,edit_mode,edit_plan,subtitle_style,status').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Gagal mengambil edit plan.' }, { status: 500, headers: noStoreHeaders() });
  if (!data) return NextResponse.json({ error: 'Project tidak ditemukan.' }, { status: 404, headers: noStoreHeaders() });
  const editPlan = data.edit_plan && typeof data.edit_plan === 'object' ? data.edit_plan as Record<string, unknown> : {};
  const subtitle = editPlan.subtitle && typeof editPlan.subtitle === 'object' ? editPlan.subtitle as Record<string, unknown> : {};
  return NextResponse.json({ controls: { format: data.format, subtitleStyle: data.subtitle_style ?? subtitle.style ?? 'bold-pop', effects: editPlan.effects ?? [], punchIns: editPlan.punchIns ?? [] }, status: data.status }, { headers: noStoreHeaders() });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(request.headers) ?? 'unknown';
  if (!(await securityGuard(`edit-plan:${ip}`, 30, 60))) {
    await logSecurityEvent({ eventType: 'rate_limit_edit_plan', severity: 'warning', request });
    return NextResponse.json({ error: 'Terlalu banyak perubahan editor. Coba lagi sebentar.' }, { status: 429, headers: noStoreHeaders() });
  }
  const isMobile = Boolean(getBearerToken(request));
  if (!isMobile && !sameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403, headers: noStoreHeaders() });
  const mobileUser = isMobile ? await getMobileUser(request) : null;
  const supabase = mobileUser?.client ?? await createClient();
  const user = mobileUser?.user ?? (await supabase.auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const duration = Number(body.duration);
  const controls = sanitizeViralEditorControls({ ...body, duration });
  const admin = createAdminClient();
  const { data: project, error: projectError } = await admin.from('projects').select('id,user_id,edit_plan,status').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (projectError) return NextResponse.json({ error: 'Gagal mengambil project.' }, { status: 500, headers: noStoreHeaders() });
  if (!project) return NextResponse.json({ error: 'Project tidak ditemukan.' }, { status: 404, headers: noStoreHeaders() });
  if (project.status === 'processing' || project.status === 'queued') return NextResponse.json({ error: 'Editor dikunci saat video sedang dirender.' }, { status: 409, headers: noStoreHeaders() });

  const existingPlan = (project.edit_plan && typeof project.edit_plan === 'object') ? project.edit_plan as Record<string, unknown> : {};
  const existingSubtitle = (existingPlan.subtitle && typeof existingPlan.subtitle === 'object') ? existingPlan.subtitle as Record<string, unknown> : {};
  const editPlan = { ...existingPlan, effects: controls.effects, punchIns: controls.punchIns, subtitle: { ...existingSubtitle, style: controls.subtitleStyle } };
  const { data: updated, error: updateError } = await admin.from('projects').update({ format: controls.format, edit_mode: 'viral', subtitle_style: controls.subtitleStyle, edit_plan: editPlan, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select('id,format,edit_mode,edit_plan,subtitle_style,status').single();
  if (updateError || !updated) return NextResponse.json({ error: 'Perubahan editor tidak dapat disimpan.' }, { status: 500, headers: noStoreHeaders() });
  return NextResponse.json({ ok: true, controls }, { headers: noStoreHeaders() });
}
