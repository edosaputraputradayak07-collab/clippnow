import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isOwnerPlan } from '@/lib/billing/access';
import { noStoreHeaders, sameOrigin } from '@/lib/security/request';
import { logSecurityEvent } from '@/lib/security/defense';

export async function GET(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403, headers: noStoreHeaders() });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });

  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('plan').eq('id', user.id).single();
  if (!isOwnerPlan(profile?.plan)) {
    await logSecurityEvent({ userId: user.id, eventType: 'unauthorized_security_events_access', severity: 'warning', request });
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: noStoreHeaders() });
  }

  const { data, error } = await admin
    .from('security_events')
    .select('id,user_id,event_type,severity,ip_address,user_agent,metadata,created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: 'Gagal mengambil security events.' }, { status: 500, headers: noStoreHeaders() });
  return NextResponse.json({ events: data ?? [] }, { headers: noStoreHeaders() });
}
