import { describe, expect, it } from 'vitest';
import { shouldAutoStartRender } from './auto-render';

describe('shouldAutoStartRender', () => {
  it('starts the automatic render flow for queued or source-ready projects', () => {
    expect(shouldAutoStartRender('queued')).toBe(true);
    expect(shouldAutoStartRender('ready')).toBe(true);
  });

  it('does not start again for processing, completed, or failed projects', () => {
    expect(shouldAutoStartRender('processing')).toBe(false);
    expect(shouldAutoStartRender('completed')).toBe(false);
    expect(shouldAutoStartRender('failed')).toBe(false);
  });
});
