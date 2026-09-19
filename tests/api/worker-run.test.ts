import { describe, expect, it, vi } from 'vitest';

const run = vi.fn();
const build = vi.fn();
vi.mock('../../src/lib/content-engine-worker', () => ({ runContentEngineJob: run }));
vi.mock('../../src/lib/worker-production', () => ({ createProductionContentEngineDependencies: build }));

describe('worker runner route', () => {
  it('rejects requests without the runner secret', async () => {
    process.env.WORKER_RUNNER_SECRET = 'secret';
    const { POST } = await import('../../app/api/internal/worker/run/route');
    const response = await POST(new Request('http://localhost/api/internal/worker/run', { method:'POST' }));
    expect(response.status).toBe(401);
    expect(run).not.toHaveBeenCalled();
  });

  it('runs exactly one claimed job for an authorized request', async () => {
    process.env.WORKER_RUNNER_SECRET = 'secret';
    build.mockReturnValueOnce({ claim: vi.fn() });
    run.mockResolvedValueOnce('COMPLETED');
    const { POST } = await import('../../app/api/internal/worker/run/route');
    const response = await POST(new Request('http://localhost/api/internal/worker/run', {
      method:'POST', headers:{ authorization:'Bearer secret' },
    }));
    expect(response.status).toBe(200);
    expect(run).toHaveBeenCalledWith({ claim: expect.any(Function) });
  });
});