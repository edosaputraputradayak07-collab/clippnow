import { createSupabaseAdminClient } from './supabase/admin';

type CreditWallet = { balance: number; reserved: number };
type WorkerCreditJob = { userId: string; jobId: string };

type CreditClient = {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        eq(column: string, value: string): {
          maybeSingle(): Promise<{ data: { amount: number } | null; error: { message: string } | null }>;
        };
      };
    };
  };
  rpc(name: string, args: Record<string, unknown>): Promise<{ data: CreditWallet | null; error: { message: string } | null }>;
};

async function reservedAmount(client: CreditClient, jobId: string): Promise<number> {
  const { data, error } = await client
    .from('credit_ledger')
    .select('amount')
    .eq('reference_id', jobId)
    .eq('entry_type', 'reserve')
    .maybeSingle();

  if (error) throw new Error(`WORKER_CREDIT_LOOKUP_FAILED:${error.message}`);
  if (!data || !Number.isInteger(data.amount) || data.amount <= 0) {
    throw new Error('WORKER_CREDIT_RESERVATION_NOT_FOUND');
  }
  return data.amount;
}

export function createWorkerCreditActions(
  createClient: () => CreditClient = () => createSupabaseAdminClient() as unknown as CreditClient,
) {
  return {
    async consume(job: WorkerCreditJob): Promise<CreditWallet> {
      if (!job.userId.trim() || !job.jobId.trim()) throw new Error('WORKER_CREDIT_INPUT_INVALID');
      const client = createClient();
      const amount = await reservedAmount(client, job.jobId);
      const { data, error } = await client.rpc('consume_user_credits', {
        p_user_id: job.userId,
        p_amount: amount,
        p_idempotency_key: `job:${job.jobId}:consume`,
        p_reference_id: job.jobId,
      });
      if (error || !data) throw new Error(`WORKER_CREDIT_CONSUME_FAILED:${error?.message ?? 'missing wallet'}`);
      return data;
    },
    async release(job: WorkerCreditJob): Promise<CreditWallet> {
      if (!job.userId.trim() || !job.jobId.trim()) throw new Error('WORKER_CREDIT_INPUT_INVALID');
      const client = createClient();
      const amount = await reservedAmount(client, job.jobId);
      const { data, error } = await client.rpc('release_user_credits', {
        p_user_id: job.userId,
        p_amount: amount,
        p_idempotency_key: `job:${job.jobId}:release`,
        p_reference_id: job.jobId,
      });
      if (error || !data) throw new Error(`WORKER_CREDIT_RELEASE_FAILED:${error?.message ?? 'missing wallet'}`);
      return data;
    },
  };
}
