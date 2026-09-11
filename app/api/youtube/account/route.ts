import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listYouTubeAccounts } from '@/lib/youtube/client';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    return NextResponse.json({ accounts: await listYouTubeAccounts(user.id) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Gagal mengambil akun YouTube.' }, { status: 500 });
  }
}
