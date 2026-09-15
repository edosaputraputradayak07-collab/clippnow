import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../src/lib/auth';
import { buildSourcePath, SOURCE_VIDEO_BUCKET, validateSourceVideo } from '../../../../../src/lib/media';
import { createSupabaseServerClient } from '../../../../../src/lib/supabase/server';

type RouteContext = { params: Promise<{ projectId: string }> };

type PrepareBody = {
  phase: 'prepare';
  filename: string;
  contentType: string;
  size: number;
};

type CompleteBody = {
  phase: 'complete';
  sourcePath: string;
};

function isPrepareBody(value: unknown): value is PrepareBody {
  if (!value || typeof value !== 'object') return false;
  const body = value as Record<string, unknown>;
  return body.phase === 'prepare' && typeof body.filename === 'string' && typeof body.contentType === 'string' && typeof body.size === 'number';
}

function isCompleteBody(value: unknown): value is CompleteBody {
  if (!value || typeof value !== 'object') return false;
  const body = value as Record<string, unknown>;
  return body.phase === 'complete' && typeof body.sourcePath === 'string';
}

export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });

  const { projectId } = await context.params;
  const supabase = await createSupabaseServerClient();
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, source_type, user_id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (projectError) return NextResponse.json({ error: 'PROJECT_READ_FAILED' }, { status: 500 });
  if (!project) return NextResponse.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 });
  if (project.source_type !== 'upload') return NextResponse.json({ error: 'PROJECT_SOURCE_NOT_UPLOAD' }, { status: 409 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }

  if (isPrepareBody(body)) {
    const validationError = validateSourceVideo({ contentType: body.contentType, size: body.size });
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const sourcePath = buildSourcePath(user.id, projectId, body.filename, randomUUID());
    const { data, error } = await supabase.storage.from(SOURCE_VIDEO_BUCKET).createSignedUploadUrl(sourcePath);
    if (error || !data?.token) return NextResponse.json({ error: 'UPLOAD_URL_FAILED' }, { status: 500 });

    return NextResponse.json({ sourcePath, token: data.token, signedUrl: data.signedUrl, expiresInSeconds: 600 }, { status: 200 });
  }

  if (isCompleteBody(body)) {
    const prefix = `${user.id}/${projectId}/`;
    if (!body.sourcePath.startsWith(prefix)) return NextResponse.json({ error: 'INVALID_SOURCE_PATH' }, { status: 400 });

    const { data: updated, error } = await supabase
      .from('projects')
      .update({ source_path: body.sourcePath })
      .eq('id', projectId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: 'PROJECT_UPDATE_FAILED' }, { status: 500 });
    return NextResponse.json({ project: updated }, { status: 200 });
  }

  return NextResponse.json({ error: 'INVALID_UPLOAD_REQUEST' }, { status: 400 });
}
