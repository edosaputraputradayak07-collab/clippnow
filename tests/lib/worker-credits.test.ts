import { describe, expect, it, vi } from 'vitest';
import { createWorkerCreditActions } from '../../src/lib/worker-credits';

describe('worker credit actions', () => {
  it('reads the reserved amount and consumes it idempotently', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { balance: 7, reserved: 0 }, error: null });
    const maybeSingle = vi.fn().mockResolvedValue({ data: { amount: 3 }, error: null });
    const eq2 = vi.fn(() => ({ maybeSingle }));
    const eq1 = vi.fn(() => ({ eq: eq2 }));
    const client = { from: vi.fn(() => ({ select: vi.fn(() => ({ eq: eq1 })) })), rpc };
    const actions = createWorkerCreditActions(() => client as any);

    await expect(actions.consume({ userId:'u1', jobId:'j1' })).resolves.toEqual({ balance:7, reserved:0 });
    expect(rpc).toHaveBeenCalledWith('consume_user_credits', {
      p_user_id:'u1', p_amount:3, p_idempotency_key:'job:j1:consume', p_reference_id:'j1',
    });
  });

  it('releases the same reserved amount on failure', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { balance: 10, reserved: 0 }, error: null });
    const maybeSingle = vi.fn().mockResolvedValue({ data: { amount: 2 }, error: null });
    const eq2 = vi.fn(() => ({ maybeSingle }));
    const eq1 = vi.fn(() => ({ eq: eq2 }));
    const client = { from: vi.fn(() => ({ select: vi.fn(() => ({ eq: eq1 })) })), rpc };
    const actions = createWorkerCreditActions(() => client as any);

    await expect(actions.release({ userId:'u1', jobId:'j2' })).resolves.toEqual({ balance:10, reserved:0 });
    expect(rpc).toHaveBeenCalledWith('release_user_credits', {
      p_user_id:'u1', p_amount:2, p_idempotency_key:'job:j2:release', p_reference_id:'j2',
    });
  });
});