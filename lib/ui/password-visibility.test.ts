import { describe, expect, it } from 'vitest';
import { getPasswordInputType } from './password-visibility';

describe('getPasswordInputType', () => {
  it('keeps the password masked by default', () => {
    expect(getPasswordInputType(false)).toBe('password');
  });

  it('shows the password when visibility is enabled', () => {
    expect(getPasswordInputType(true)).toBe('text');
  });
});
