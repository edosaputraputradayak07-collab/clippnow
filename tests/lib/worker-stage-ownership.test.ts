import { describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
vi.mock('../../src/lib/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({ rpc }),
}));

import { updateContentEngineStage } from '../../src/lib/worker-db';

describe('worker stage ownership', () => {
  it('rejects when the database reports lease ownership was lost', async () => {
    rpc.mockResolvedValueOnce({ data: [], error: null });
    await expect(
      updateContentEngineStage('j1','QUEUED','DOWNLOADING','l1',10),
    ).rejects.toThrow('WORKER_STAGE_OWNERSHIP_LOST');
  });
});