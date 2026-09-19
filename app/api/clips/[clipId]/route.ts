import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../src/lib/auth';
import { createSupabaseServerClient } from '../../../../src/lib/supabase/server';

type RouteContext = { params: Promise<{ clipId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  const { clipId } = await context.params;
  let body: { startMs?: number; endMs?: number; title?: string; caption?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }); }
  if (body.startMs !== undefined && (!Number.isFinite(body.startMs) || body.startMs < 0)) return NextResponse.json({ error: 'START_INVALID' }, { status: 400 });
  if (body.endMs !== undefined && (!Number.isFinite(body.endMs) || body.endMs <= Number(body.startMs ?? 0))) return NextResponse.json({ error: 'END_INVALID' }, { status: 400 });
  const update: Record<string, unknown> = {};
  if (body.startMs !== undefined) update.start_ms = body.startMs;
  if (body.endMs !== undefined) update.end_ms = body.endMs;
  if (body.title !== undefined) update.title = body.title.trim().slice(0, 160);
  if (body.caption !== undefined) update.caption = body.caption.trim().slice(0, 4000);
  if (!Object.keys(update).length) return NextResponse.json({ error: 'NO_CHANGES' }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('clips').update(update).eq('id', clipId).eq('user_id', user.id).select('*').maybeSingle();
  if (error) return NextResponse.json({ error: 'CLIP_UPDATE_FAILED' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'CLIP_NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ clip: data }, { status: 200 });
}
