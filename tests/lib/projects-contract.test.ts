import { describe, expect, it } from 'vitest';
import { projectOwnerFilter, validateCreateProjectInput } from '../../src/lib/projects/contracts';

describe('VidClipMoney project contracts', () => {
  const base = { mode: 'affiliate' as const, sourceType: 'upload' as const, sourcePath: 'source-videos/u/v.mp4', idempotencyKey: 'idem-1' };

  it('accepts a valid upload project', () => expect(validateCreateProjectInput(base)).toBeNull());
  it('accepts a valid YouTube project', () => expect(validateCreateProjectInput({ ...base, sourceType: 'youtube', sourcePath: undefined, sourceUrl: 'https://www.youtube.com/watch?v=abc' })).toBeNull());
  it('rejects invalid mode and missing idempotency key', () => {
    expect(validateCreateProjectInput({ ...base, mode: 'invalid' as never })).toBe('Invalid content mode');
    expect(validateCreateProjectInput({ ...base, idempotencyKey: ' ' })).toBe('Idempotency key is required');
  });
  it('enforces an actor-specific ownership filter', () => {
    expect(projectOwnerFilter({ userId: 'u1' })).toEqual({ user_id: 'u1' });
    expect(projectOwnerFilter({ guestToken: 'g1' })).toEqual({ guest_token: 'g1' });
  });
});
