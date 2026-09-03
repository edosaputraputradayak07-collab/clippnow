import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getBearerToken, getMobileUser } from '@/lib/auth/mobile-request';
import { getClientIp, logSecurityEvent, securityGuard } from '@/lib/security/defense';
import { sameOrigin, noStoreHeaders } from '@/lib/security/request';
import { buildViralEditPlan, type ViralGoal } from '@/lib/ai/viral-edit-plan';

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
  const { data: project, error: projectError } = await supabase.from('projects').select('id,user_id,source_path,start_seconds,end_seconds,format').eq('id', id).eq('user_id', user.id).single();
  if (projectError || !project) return NextResponse.json({ error: 'Project tidak ditemukan.' }, { status: 404, headers: noStoreHeaders() });
  const admin = createAdminClient();
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
  const plan = buildViralEditPlan({ durationSeconds: duration, format: project.format, goal: requestedGoal, transcript: localSegments });
  const selectedStart = offset + plan.clip.startSeconds;
  const selectedEnd = offset + plan.clip.endSeconds;
  const words = (transcription.words ?? []).filter(word => word.start < plan.clip.endSeconds && word.end > plan.clip.startSeconds).map(word => ({ ...word, start: word.start + offset, end: word.end + offset }));
  await admin.from('projects').update({ start_seconds: selectedStart, end_seconds: selectedEnd, edit_mode: 'viral', subtitle_style: plan.subtitle.style, viral_score: plan.score, edit_plan: { ...plan, transcript: localSegments, words }, updated_at: new Date().toISOString() }).eq('id', project.id).eq('user_id', user.id);
  return NextResponse.json({ transcript: localSegments, words, plan: { ...plan, clip: { startSeconds: selectedStart, endSeconds: selectedEnd } } }, { headers: noStoreHeaders() });
}
