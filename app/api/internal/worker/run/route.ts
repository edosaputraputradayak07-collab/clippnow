import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { runContentEngineJob } from '../../../../../src/lib/content-engine-worker';
import { createProductionContentEngineDependencies } from '../../../../../src/lib/worker-production';

export const runtime = 'nodejs';
export const maxDuration = 300;

function authorized(request: Request, secret: string): boolean {
  const header = request.headers.get('authorization') ?? '';
  const supplied = header.startsWith('Bearer ') ? header.slice(7) : '';
  const a = Buffer.from(supplied);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const secret = process.env.WORKER_RUNNER_SECRET?.trim();
  if (!secret) return NextResponse.json({ error:'WORKER_RUNNER_NOT_CONFIGURED' }, { status:503 });
  if (!authorized(request, secret)) return NextResponse.json({ error:'UNAUTHORIZED' }, { status:401 });

  try {
    const deps = createProductionContentEngineDependencies();
    const status = await runContentEngineJob(deps);
    return NextResponse.json({ status }, { status:200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'WORKER_RUNNER_FAILED';
    return NextResponse.json({ error:message }, { status:500 });
  }
}
