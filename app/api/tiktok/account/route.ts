import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTikTokAccount } from '@/lib/tiktok/client';
import { noStoreHeaders } from '@/lib/security/request';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });
  const account = await getTikTokAccount(user.id);
  if (!account) return NextResponse.json({ connected: false }, { headers: noStoreHeaders() });
  return NextResponse.json({ connected: true, account: { id: account.id, open_id: account.open_id, display_name: account.display_name, avatar_url: account.avatar_url, scopes: account.scopes } }, { headers: noStoreHeaders() });
}
