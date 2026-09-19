import { describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
vi.mock('../../src/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({ rpc }),
}));

import { updateContentEngineStage, failContentEngineJob } from '../../src/lib/worker-db';

describe('worker stage adapter', () => {
  it('updates a stage only through the leased RPC', async () => {
    rpc.mockResolvedValueOnce({ data: [{ updated: true }], error: null });
    await expect(updateContentEngineStage('j1', 'QUEUED', 'DOWNLOADING', 'l1', 10)).resolves.toBeUndefined();
    expect(rpc).toHaveBeenCalledWith('update_content_engine_stage', {
      p_job_id: 'j1',
      p_from_status: 'QUEUED',
      p_to_status: 'DOWNLOADING',
      p_lease_id: 'l1',
      p_progress: 10,
    });
  });

  it('fails through the leased RPC', async () => {
    rpc.mockResolvedValueOnce({ data: [{ updated: true }], error: null });
    await expect(failContentEngineJob('j1', 'l1', 'STT_FAILED')).resolves.toBeUndefined();
  });
});
