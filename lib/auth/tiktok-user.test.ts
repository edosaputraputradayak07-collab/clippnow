import { describe, expect, it } from 'vitest';
import { toSupabaseUserInfo } from './tiktok-user';

describe('TikTok user info adapter', () => {
  it('maps TikTok identity fields to standard OAuth userinfo claims', () => {
    expect(toSupabaseUserInfo({
      data: {
        user: {
          open_id: 'tiktok-open-id',
          display_name: 'Creator',
          avatar_url: 'https://example.com/avatar.jpg',
        },
      },
    })).toEqual({
      sub: 'tiktok-open-id',
      name: 'Creator',
      picture: 'https://example.com/avatar.jpg',
    });
  });

  it('rejects a TikTok response without an open_id', () => {
    expect(() => toSupabaseUserInfo({ data: { user: { display_name: 'Creator' } } })).toThrow('TikTok user id missing');
  });
});
