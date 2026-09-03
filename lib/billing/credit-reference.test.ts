import { describe, expect, it } from 'vitest';
import { buildRenderCreditReference } from './credit-reference';

describe('buildRenderCreditReference', () => {
  it('keeps the original project reference for the first attempt', () => {
    expect(buildRenderCreditReference('project-123', 0)).toBe('project-123');
  });

  it('creates a distinct bounded reference for each retry attempt', () => {
    const firstRetry = buildRenderCreditReference('project-123', 1);
    const secondRetry = buildRenderCreditReference('project-123', 2);

    expect(firstRetry).toBe('project-123:render:1');
    expect(secondRetry).toBe('project-123:render:2');
    expect(firstRetry).not.toBe(secondRetry);
    expect(firstRetry.length).toBeLessThanOrEqual(128);
  });
});
