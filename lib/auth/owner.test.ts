import { describe, expect, it } from 'vitest';
import { isOwnerEmail, isOwnerUser } from './owner';

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

describe('isOwnerUser', () => {
  it('reads the owner identity only from the server-side environment configuration', () => {
    expect(
      isOwnerUser('Owner@Example.com', { CLIPPNOW_OWNER_EMAIL: ' owner@example.com ' }),
    ).toBe(true);
  });

  it('fails closed when the server-side owner configuration is absent', () => {
    expect(isOwnerUser('owner@example.com', {})).toBe(false);
  });
});
