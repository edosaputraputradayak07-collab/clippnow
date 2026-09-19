type Renew = () => Promise<unknown>;

export type WorkerHeartbeatOptions = {
  intervalMs: number;
};

export async function withWorkerLeaseHeartbeat<T>(
  operation: Promise<T>,
  renew: Renew,
  options: WorkerHeartbeatOptions,
): Promise<T> {
  if (!Number.isInteger(options.intervalMs) || options.intervalMs <= 0) {
    throw new Error('WORKER_HEARTBEAT_INTERVAL_INVALID');
  }

  let settled = false;
  let heartbeatFailure: unknown = null;
  let resolveFailure!: (reason: unknown) => void;
  const failure = new Promise<never>((_, reject) => {
    resolveFailure = reject;
  });

  const timer = setInterval(() => {
    void renew().catch((error: unknown) => {
      if (!settled && heartbeatFailure === null) {
        heartbeatFailure = error;
        resolveFailure(error);
      }
    });
  }, options.intervalMs);

  try {
    return await Promise.race([operation, failure]);
  } finally {
    settled = true;
    clearInterval(timer);
    void heartbeatFailure;
  }
}
