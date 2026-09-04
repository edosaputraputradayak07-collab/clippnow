import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getBearerToken, getMobileUser } from '@/lib/auth/mobile-request';
import { getClientIp, logSecurityEvent, securityGuard } from '@/lib/security/defense';
import { sameOrigin, noStoreHeaders } from '@/lib/security/request';
import { buildViralEditPlans, type ViralGoal } from '@/lib/ai/viral-edit-plan';
import { selectClipWords } from '@/lib/ai/transcript-clip';

const BUCKET = 'clippnow-videos';
const OPENAI_URL = 'https://api.openai.com/v1/audio/transcriptions';
function goal(value: unknown): ViralGoal { const allowed: ViralGoal[] = ['tiktok','instagram-reels','youtube-shorts','story','podcast','gaming','music','vlog','education']; return typeof value === 'string' && allowed.includes(value as ViralGoal) ? value as ViralGoal : 'tiktok'; }

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const isMobile = Boolean(getBearerToken(request));
  if (!isMobile && !sameOrigin(request)) { await logSecurityEvent({ eventType: 'invalid_origin_ai', severity: 'warning', request }); return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403, headers: noStoreHeaders() }); }
  const mobileUser = isMobile ? await getMobileUser(request) : null;
  const supabase = mobileUser?.client ?? await createClient();
  const user = mobileUser?.user ?? (await supabase.auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });
  const ip = getClientIp(request.headers) ?? 'unknown';
  if (!(await securityGuard(`ai:${user.id}:${ip}`, 5, 60))) { await logSecurityEvent({ userId: user.id, eventType: 'rate_limit_ai', severity: 'warning', request }); return NextResponse.json({ error: 'Terlalu banyak permintaan AI. Coba lagi sebentar.' }, { status: 429, headers: noStoreHeaders() }); }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI subtitle belum dikonfigurasi.' }, { status: 503, headers: noStoreHeaders() });
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const requestedGoal = goal(body.goal);
  const language = typeof body.language === 'string' ? body.language.slice(0, 10) : undefined;
  const requestedCount = Number(body.count);
  const count = Number.isFinite(requestedCount) ? Math.min(10, Math.max(5, Math.floor(requestedCount))) : 1;
  const { data: project, error: projectError } = await supabase.from('projects').select('id,user_id,name,original_filename,source_path,start_seconds,end_seconds,format').eq('id', id).eq('user_id', user.id).single();
  if (projectError || !project) return NextResponse.json({ error: 'Project tidak ditemukan.' }, { status: 404, headers: noStoreHeaders() });
  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('plan,credits').eq('id', user.id).single();
  const owner = profile?.plan === 'owner';
  // The initial project creation already reserves one credit. Only the additional
  // batch projects need new reservations here.
  const additionalCount = Math.max(0, count - 1);
  if (additionalCount > 0 && !owner) {
    if (!profile || Number(profile.credits) < additionalCount) return NextResponse.json({ error: `Batch ${count} video membutuhkan ${count} kredit. Setelah clip pertama dibuat, kamu membutuhkan ${additionalCount} kredit lagi.` }, { status: 402, headers: noStoreHeaders() });
  }
  const { data: source, error: sourceError } = await admin.storage.from(BUCKET).download(project.source_path);
  if (sourceError || !source) return NextResponse.json({ error: 'Video sumber tidak dapat dibaca.' }, { status: 404, headers: noStoreHeaders() });
  const form = new FormData();
  form.append('file', new File([await source.arrayBuffer()], 'source.mp4', { type: source.type || 'video/mp4' }));
  form.append('model', 'whisper-1'); form.append('response_format', 'verbose_json'); form.append('timestamp_granularities[]', 'word'); form.append('timestamp_granularities[]', 'segment'); if (language) form.append('language', language);
  const response = await fetch(OPENAI_URL, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: form, cache: 'no-store' });
  if (!response.ok) { const detail = await response.text().catch(() => ''); console.error('OpenAI transcription failed', response.status, detail.slice(0, 500)); return NextResponse.json({ error: 'Transkripsi AI gagal. Coba lagi.' }, { status: 502, headers: noStoreHeaders() }); }
  const transcription = await response.json() as { text?: string; segments?: Array<{ start: number; end: number; text: string }>; words?: Array<{ start: number; end: number; word: string }> };
  const offset = Number(project.start_seconds) || 0;
  const end = Number(project.end_seconds);
  const duration = Math.max(0.1, end - offset);
  const localSegments = (transcription.segments ?? []).map(segment => ({ start: Math.max(0, segment.start), end: Math.min(duration, segment.end), text: segment.text.trim() })).filter(segment => segment.end > segment.start && segment.text);
  const plans = buildViralEditPlans({ durationSeconds: duration, format: project.format, goal: requestedGoal, transcript: localSegments, count });
  if (!plans.length) return NextResponse.json({ error: 'AI belum menemukan momen yang cukup berbeda untuk dibuat menjadi clip.' }, { status: 422, headers: noStoreHeaders() });
  const projectIds: string[] = [];
  const createdExtraIds: string[] = [];
  const extraReferences: string[] = [];
  const first = plans[0];
  const firstStart = offset + first.clip.startSeconds;
  const firstEnd = offset + first.clip.endSeconds;
  const firstWords = selectClipWords(transcription.words ?? [], first.clip.startSeconds, first.clip.endSeconds);
  const { error: firstUpdateError } = await admin.from('projects').update({ start_seconds: firstStart, end_seconds: firstEnd, edit_mode: 'viral', subtitle_style: first.subtitle.style, viral_score: first.score, edit_plan: { ...first, transcript: localSegments, words: firstWords }, updated_at: new Date().toISOString() }).eq('id', project.id).eq('user_id', user.id);
  if (firstUpdateError) return NextResponse.json({ error: 'Hasil AI tidak dapat disimpan. Coba lagi.' }, { status: 500, headers: noStoreHeaders() });
  projectIds.push(project.id);

  for (let index = 1; index < plans.length; index += 1) {
    const plan = plans[index];
    const reference = crypto.randomUUID();
    if (!owner) {
      const { error: creditError } = await admin.rpc('reserve_clippnow_credit', { p_user_id: user.id, p_reference: reference });
      if (creditError) {
        for (const ref of extraReferences) await admin.rpc('release_clippnow_credit', { p_user_id: user.id, p_reference: ref });
        await admin.from('projects').delete().in('id', createdExtraIds).eq('user_id', user.id);
        return NextResponse.json({ error: 'Kredit tidak cukup untuk menyelesaikan batch. Tidak ada kredit tambahan yang dipakai.' }, { status: 402, headers: noStoreHeaders() });
      }
      extraReferences.push(reference);
    }
    const start = offset + plan.clip.startSeconds;
    const finish = offset + plan.clip.endSeconds;
    const words = selectClipWords(transcription.words ?? [], plan.clip.startSeconds, plan.clip.endSeconds);
    const { data: child, error: childError } = await admin.from('projects').insert({ user_id: user.id, name: `${project.name || 'Viral Clip'} • ${index + 1}`, original_filename: project.original_filename, start_seconds: start, end_seconds: finish, format: project.format, source_path: project.source_path, status: 'queued', credit_reference: owner ? crypto.randomUUID() : reference, edit_mode: 'viral', subtitle_style: plan.subtitle.style, viral_score: plan.score, edit_plan: { ...plan, transcript: localSegments, words } }).select('id').single();
    if (childError || !child) {
      if (!owner) await admin.rpc('release_clippnow_credit', { p_user_id: user.id, p_reference: reference });
      for (const ref of extraReferences) if (ref !== reference) await admin.rpc('release_clippnow_credit', { p_user_id: user.id, p_reference: ref });
      await admin.from('projects').delete().in('id', createdExtraIds).eq('user_id', user.id);
      return NextResponse.json({ error: 'Gagal membuat salah satu video batch.' }, { status: 500, headers: noStoreHeaders() });
    }
    createdExtraIds.push(child.id);
    const { error: jobError } = await admin.from('jobs').insert({ user_id: user.id, project_id: child.id, source_path: project.source_path, status: 'queued', progress: 0 });
    if (jobError) {
      await admin.from('projects').delete().eq('id', child.id).eq('user_id', user.id);
      if (!owner) await admin.rpc('release_clippnow_credit', { p_user_id: user.id, p_reference: reference });
      for (const ref of extraReferences) if (ref !== reference) await admin.rpc('release_clippnow_credit', { p_user_id: user.id, p_reference: ref });
      await admin.from('projects').delete().in('id', createdExtraIds).eq('user_id', user.id);
      return NextResponse.json({ error: 'Gagal membuat render job batch.' }, { status: 500, headers: noStoreHeaders() });
    }
    projectIds.push(child.id);
  }

  return NextResponse.json({ transcript: localSegments, plans: plans.map((plan, index) => ({ ...plan, clip: { startSeconds: offset + plan.clip.startSeconds, endSeconds: offset + plan.clip.endSeconds }, project_id: projectIds[index] })), project_ids: projectIds, batch_count: projectIds.length }, { headers: noStoreHeaders() });
}
