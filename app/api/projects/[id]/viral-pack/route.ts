import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getBearerToken, getMobileUser } from '@/lib/auth/mobile-request';
import { getClientIp, logSecurityEvent, securityGuard } from '@/lib/security/defense';
import { sameOrigin, noStoreHeaders } from '@/lib/security/request';
import { buildViralPack, type ViralPack, type ViralPackPlatform } from '@/lib/ai/viral-pack';

const PLATFORMS: ViralPackPlatform[] = ['tiktok', 'instagram-reels', 'youtube-shorts', 'facebook-reels'];

function platform(value: unknown): ViralPackPlatform {
  return typeof value === 'string' && PLATFORMS.includes(value as ViralPackPlatform) ? value as ViralPackPlatform : 'tiktok';
}

function isPack(value: unknown): value is ViralPack {
  if (!value || typeof value !== 'object') return false;
  const pack = value as Record<string, unknown>;
  return Array.isArray(pack.titles) && pack.titles.length === 3 && typeof pack.caption === 'string' && Array.isArray(pack.hashtags) && Array.isArray(pack.keywords) && typeof pack.cta === 'string' && typeof pack.angle === 'string';
}

function sanitizePack(pack: ViralPack): ViralPack {
  const stripGuarantee = (value: string) => value.replace(/\b(pasti\s+(viral|fyp)|dijamin\s+(viral|fyp)|jaminan\s+(viral|fyp))\b/gi, 'berpotensi menarik');
  return {
    titles: pack.titles.map(stripGuarantee) as [string, string, string],
    caption: stripGuarantee(pack.caption),
    hashtags: [...new Set(pack.hashtags.filter(tag => /^#[\p{L}\p{N}_]+$/u.test(tag)))].slice(0, 10),
    keywords: [...new Set(pack.keywords.filter(word => typeof word === 'string' && word.trim()))].slice(0, 8),
    cta: stripGuarantee(pack.cta),
    angle: stripGuarantee(pack.angle),
  };
}

async function enhanceWithOpenAI(base: ViralPack, transcript: string, target: ViralPackPlatform): Promise<ViralPack> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return base;
  const model = process.env.OPENAI_VIRAL_PACK_MODEL || 'gpt-4o-mini';
  const prompt = [
    'Create a social media posting pack in Indonesian from the supplied transcript.',
    `Target platform: ${target}.`,
    'Return JSON only with exactly: titles (array of 3 strings), caption (string), hashtags (array of 5-10 strings), keywords (array of 3-8 strings), cta (string), angle (string).',
    'Use only claims supported by the transcript. Never promise or guarantee virality, FYP, views, reach, or engagement.',
    `Transcript:\n${transcript.slice(0, 12000)}`,
  ].join('\n');
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, temperature: 0.7, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You are a careful social-media copywriter. Output valid JSON only.' }, { role: 'user', content: prompt }] }),
      cache: 'no-store',
    });
    if (!response.ok) return base;
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return base;
    const parsed = JSON.parse(content) as unknown;
    return isPack(parsed) ? sanitizePack(parsed) : base;
  } catch {
    return base;
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const isMobile = Boolean(getBearerToken(request));
  if (!isMobile && !sameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403, headers: noStoreHeaders() });
  const mobileUser = isMobile ? await getMobileUser(request) : null;
  const supabase = mobileUser?.client ?? await createClient();
  const user = mobileUser?.user ?? (await supabase.auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });
  const ip = getClientIp(request.headers) ?? 'unknown';
  if (!(await securityGuard(`viral-pack:${user.id}:${ip}`, 10, 60))) {
    await logSecurityEvent({ userId: user.id, eventType: 'rate_limit_viral_pack', severity: 'warning', request });
    return NextResponse.json({ error: 'Terlalu banyak permintaan Viral Pack. Coba lagi sebentar.' }, { status: 429, headers: noStoreHeaders() });
  }

  const { id } = await params;
  const target = platform(new URL(request.url).searchParams.get('platform'));
  const admin = createAdminClient();
  const { data: project, error } = await admin.from('projects').select('id,name,status,viral_score,edit_plan').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Gagal mengambil project.' }, { status: 500, headers: noStoreHeaders() });
  if (!project) return NextResponse.json({ error: 'Project tidak ditemukan.' }, { status: 404, headers: noStoreHeaders() });
  if (project.status !== 'completed') return NextResponse.json({ error: 'Viral Pack tersedia setelah video selesai dirender.' }, { status: 409, headers: noStoreHeaders() });

  const editPlan = project.edit_plan && typeof project.edit_plan === 'object' ? project.edit_plan as Record<string, unknown> : {};
  const transcript = typeof editPlan.transcript === 'string' ? editPlan.transcript : Array.isArray(editPlan.transcript) ? editPlan.transcript.map(item => typeof item === 'object' && item && 'text' in item ? String((item as { text?: unknown }).text ?? '') : '').filter(Boolean).join(' ') : '';
  const base = buildViralPack({ platform: target, title: project.name || 'Viral Clip', transcript, score: Number(project.viral_score) || 0 });
  const pack = await enhanceWithOpenAI(base, transcript, target);
  return NextResponse.json({ pack, platform: target }, { headers: noStoreHeaders() });
}
