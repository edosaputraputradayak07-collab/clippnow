import { describe, expect, it } from 'vitest';
import { getBearerToken } from '@/lib/auth/mobile-request';

describe('mobile bearer auth contract', () => {
  it('accepts a standard Authorization bearer token', () => {
    const request = new Request('https://clippnoww.vercel.app/api/mobile/projects', {
      headers: { Authorization: 'Bearer access-token-123' },
    });

    expect(getBearerToken(request)).toBe('access-token-123');
  });

  it('rejects missing, malformed, and query-string credentials', () => {
    expect(getBearerToken(new Request('https://example.com'))).toBeNull();
    expect(getBearerToken(new Request('https://example.com', { headers: { Authorization: 'Basic abc' } }))).toBeNull();
    expect(getBearerToken(new Request('https://example.com?access_token=secret'))).toBeNull();
  });
});
