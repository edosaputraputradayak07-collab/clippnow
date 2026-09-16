import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../src/lib/auth';
import { creditsForDuration } from '../../../../src/lib/credits';
import { createSupabaseServerClient } from '../../../../src/lib/supabase/server';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  let body: { durationMs?: number; jobId?: string; idempotencyKey?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }); }
  if (!Number.isFinite(body.durationMs) || !body.jobId || !body.idempotencyKey?.trim()) return NextResponse.json({ error: 'INVALID_CREDIT_REQUEST' }, { status: 400 });
  const amount = creditsForDuration(body.durationMs as number);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc('reserve_user_credits', { p_user_id: user.id, p_amount: amount, p_idempotency_key: body.idempotencyKey.trim(), p_reference_id: body.jobId });
  if (error) return NextResponse.json({ error: error.message === 'INSUFFICIENT_CREDITS' ? 'INSUFFICIENT_CREDITS' : 'CREDIT_RESERVATION_FAILED' }, { status: error.message === 'INSUFFICIENT_CREDITS' ? 402 : 500 });
  return NextResponse.json({ wallet: data, required: amount }, { status: 200 });
}
