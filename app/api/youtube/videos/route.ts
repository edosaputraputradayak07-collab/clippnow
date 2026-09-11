import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listYouTubeVideos } from '@/lib/youtube/client';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limit = Number(new URL(request.url).searchParams.get('limit') ?? '20');
  try {
    return NextResponse.json({ videos: await listYouTubeVideos(user.id, Number.isFinite(limit) ? limit : 20) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Gagal mengambil video YouTube.' }, { status: 500 });
  }
}
