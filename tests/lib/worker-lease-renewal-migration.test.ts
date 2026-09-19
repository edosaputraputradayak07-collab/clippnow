import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260918040000_vidclipmoney_worker_lease_renewal.sql'),
  'utf8',
);

describe('worker lease renewal migration contract', () => {
  it('extends only an owned active processing lease', () => {
    expect(migration).toContain('create or replace function public.renew_content_engine_lease');
    expect(migration).toContain("j.lease_id = p_lease_id");
    expect(migration).toContain("j.status = 'processing'");
    expect(migration).toContain("j.leased_until > now()");
    expect(migration).toContain('leased_until = now()');
  });

  it('keeps the heartbeat RPC service-role only', () => {
    expect(migration).toContain("auth.role() <> 'service_role'");
    expect(migration).toContain('revoke all on function public.renew_content_engine_lease');
    expect(migration).toContain('grant execute on function public.renew_content_engine_lease');
  });
});
