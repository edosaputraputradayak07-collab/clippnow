import { describe, expect, it } from 'vitest';
import { buildMobileRequest } from '../../mobile/src/api';

describe('mobile API client contract', () => {
  it('builds bearer-authenticated requests without putting tokens in URLs', () => {
    const request = buildMobileRequest('https://clippnoww.vercel.app', '/api/mobile/projects', 'access-token');

    expect(request.url).toBe('https://clippnoww.vercel.app/api/mobile/projects');
    expect(request.headers.get('authorization')).toBe('Bearer access-token');
    expect(request.url).not.toContain('access-token');
  });
});
