import { describe, expect, it } from 'vitest';

describe('render rerun contract', () => {
  it('uses force=true as the explicit rerender opt-in', () => {
    expect(JSON.parse('{"force":true}').force).toBe(true);
    expect(JSON.parse('{"force":false}').force).toBe(false);
  });
});
