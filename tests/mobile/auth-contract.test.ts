import { describe, expect, it } from 'vitest';
import { getBearerToken } from '../../lib/auth/mobile-request';

describe('mobile bearer authentication contract', () => {
  it('extracts bearer tokens from the authorization header', () => {
    const request = new Request('https://clippnow.test/api/mobile/session', {
      headers: { authorization: 'Bearer abc123' },
    });
    expect(getBearerToken(request)).toBe('abc123');
  });

  it('rejects non-bearer authorization schemes and query tokens', () => {
    const request = new Request('https://clippnow.test/api/mobile/session?access_token=abc123', {
      headers: { authorization: 'Basic abc123' },
    });
    expect(getBearerToken(request)).toBeNull();
  });
});
