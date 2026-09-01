import { describe, expect, it } from 'vitest';
import { startRenderWorkflow } from '../../workflows/render-video';

describe('render workflow contract', () => {
  it('exports a durable render workflow entrypoint', () => {
    expect(startRenderWorkflow).toEqual(expect.any(Function));
  });
});
