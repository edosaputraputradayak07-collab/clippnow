import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../src/lib/auth';
import { createSupabaseServerClient } from '../../../../src/lib/supabase/server';

type RouteContext = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });

  const { projectId } = await context.params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'PROJECT_READ_FAILED' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ project: data }, { status: 200 });
}
