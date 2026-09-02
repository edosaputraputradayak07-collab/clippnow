import { describe, expect, it } from 'vitest';
import { isOwnerPlan } from './access';

describe('ClippNow owner billing access', () => {
  it('treats the owner plan as unlimited', () => {
    expect(isOwnerPlan('owner')).toBe(true);
  });

  it('does not treat paid plans as owner', () => {
    expect(isOwnerPlan('creator')).toBe(false);
    expect(isOwnerPlan('pro')).toBe(false);
  });
});
