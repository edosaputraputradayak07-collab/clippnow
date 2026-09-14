import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../src/lib/auth';
import { createSupabaseServerClient } from '../../../src/lib/supabase/server';
import { validateCreateProjectInput, type CreateProjectInput } from '../../../src/lib/projects/contracts';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });

  let input: CreateProjectInput;
  try {
    input = await request.json() as CreateProjectInput;
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }

  const validationError = validateCreateProjectInput(input);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .eq('idempotency_key', input.idempotencyKey)
    .maybeSingle();

  if (existing) return NextResponse.json({ project: existing, reused: true }, { status: 200 });

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      title: input.title?.trim() || 'VidClipMoney Project',
      source_type: input.sourceType,
      source_url: input.sourceUrl?.trim() || null,
      source_path: input.sourcePath?.trim() || null,
      original_filename: input.originalFilename?.trim() || null,
      duration_ms: input.durationMs ?? null,
      mode: input.mode,
      idempotency_key: input.idempotencyKey.trim(),
      status: 'draft',
      metadata: {},
      source_metadata: {},
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      const { data: retry } = await supabase.from('projects').select('*').eq('user_id', user.id).eq('idempotency_key', input.idempotencyKey).maybeSingle();
      if (retry) return NextResponse.json({ project: retry, reused: true }, { status: 200 });
    }
    return NextResponse.json({ error: 'PROJECT_CREATE_FAILED' }, { status: 500 });
  }

  return NextResponse.json({ project, reused: false }, { status: 201 });
}
