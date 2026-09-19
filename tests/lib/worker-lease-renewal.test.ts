import { describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
vi.mock('../../src/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({ rpc }),
}));

import { renewContentEngineLease } from '../../src/lib/worker-db';

describe('worker lease renewal', () => {
  it('renews an owned active lease through the database RPC', async () => {
    rpc.mockResolvedValueOnce({ data: [{ renewed: true, leased_until: '2026-09-19T01:00:00.000Z' }], error: null });

    await expect(renewContentEngineLease('j1', 'l1', 300000)).resolves.toEqual(
      new Date('2026-09-19T01:00:00.000Z').getTime(),
    );

    expect(rpc).toHaveBeenCalledWith('renew_content_engine_lease', {
      p_job_id: 'j1',
      p_lease_id: 'l1',
      p_lease_ms: 300000,
    });
  });

  it('rejects when lease ownership was lost', async () => {
    rpc.mockResolvedValueOnce({ data: [], error: null });
    await expect(renewContentEngineLease('j1', 'l1', 300000)).rejects.toThrow(
      'WORKER_LEASE_OWNERSHIP_LOST',
    );
  });

  it('rejects invalid lease durations before calling the database', async () => {
    await expect(renewContentEngineLease('j1', 'l1', 0)).rejects.toThrow('WORKER_LEASE_INVALID');
    expect(rpc).not.toHaveBeenCalled();
  });
});
