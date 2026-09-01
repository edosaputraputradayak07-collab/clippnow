import { NextResponse } from 'next/server';
import { getMobileUser } from '@/lib/auth/mobile-request';
import { noStoreHeaders } from '@/lib/security/request';

export async function GET(request: Request) {
  const context = await getMobileUser(request);
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders() });

  return NextResponse.json(
    { authenticated: true, user: { id: context.user.id, email: context.user.email ?? null } },
    { headers: noStoreHeaders() },
  );
}
