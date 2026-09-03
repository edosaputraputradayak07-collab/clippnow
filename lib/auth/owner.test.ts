import { describe, expect, it } from 'vitest';
import { isOwnerEmail } from './owner';

describe('isOwnerEmail', () => {
  it('matches the configured owner email case-insensitively and ignores surrounding whitespace', () => {
    expect(isOwnerEmail('  Owner@Example.com ', 'owner@example.com')).toBe(true);
  });

  it('does not match a different email', () => {
    expect(isOwnerEmail('other@example.com', 'owner@example.com')).toBe(false);
  });

  it('fails closed when the owner email is not configured', () => {
    expect(isOwnerEmail('owner@example.com', '')).toBe(false);
    expect(isOwnerEmail('owner@example.com', undefined)).toBe(false);
  });
});
