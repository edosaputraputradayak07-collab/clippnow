import { describe, expect, it } from 'vitest';

function isForcedRerender(body: unknown) {
  return typeof body === 'object' && body !== null && 'force' in body && (body as { force?: unknown }).force === true;
}

describe('render rerun request semantics', () => {
  it('requires an explicit boolean true', () => {
    expect(isForcedRerender({ force: true })).toBe(true);
    expect(isForcedRerender({ force: false })).toBe(false);
    expect(isForcedRerender({ force: 'true' })).toBe(false);
    expect(isForcedRerender(null)).toBe(false);
  });
});
