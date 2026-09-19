import { describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
vi.mock('../../src/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({ rpc }),
}));

import { claimNextContentEngineJob } from '../../src/lib/worker-db';

describe('worker database adapter', () => {
  it('maps an atomically claimed job from the RPC response', async () => {
    rpc.mockResolvedValueOnce({
      data: [{
        id: 'j1',
        project_id: 'p1',
        user_id: 'u1',
        mode: 'affiliate',
        engine_status: 'QUEUED',
        lease_id: 'l1',
        leased_until: '2026-09-17T10:05:00.000Z',
        attempts: 1,
        input_path: 'u1/p1/source.mp4',
      }],
      error: null,
    });

    await expect(claimNextContentEngineJob()).resolves.toMatchObject({
      id: 'j1',
      projectId: 'p1',
      leaseId: 'l1',
      attempts: 1,
    });
    expect(rpc).toHaveBeenCalledWith('claim_content_engine_job', { p_lease_ms: 300000 });
  });

  it('returns null when no queued job is available', async () => {
    rpc.mockResolvedValueOnce({ data: [], error: null });
    await expect(claimNextContentEngineJob()).resolves.toBeNull();
  });
});
