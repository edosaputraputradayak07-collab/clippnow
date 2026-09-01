import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('render workflow boundaries', () => {
  it('keeps Node-only render dependencies outside the workflow module', () => {
    const workflow = readFileSync(path.join(process.cwd(), 'workflows/render-video.ts'), 'utf8');
    expect(workflow).not.toContain("@/worker/render-worker");
    expect(workflow).toContain("'use workflow'");
    expect(workflow).toContain("'./render-video-step'");
  });

  it('marks the render worker adapter as a workflow step', () => {
    const step = readFileSync(path.join(process.cwd(), 'workflows/render-video-step.ts'), 'utf8');
    expect(step).toContain("'use step'");
    expect(step).toContain("@/worker/render-worker");
  });
});
