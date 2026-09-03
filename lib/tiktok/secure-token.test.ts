import { describe, expect, it } from 'vitest';
import { decryptTikTokToken, encryptTikTokToken } from './secure-token';

describe('TikTok token encryption', () => {
  it('round-trips a token without exposing plaintext', () => {
    const key = 'a'.repeat(64);
    const token = 'act.secret-token-value';
    const encrypted = encryptTikTokToken(token, key);
    expect(encrypted).not.toContain(token);
    expect(decryptTikTokToken(encrypted, key)).toBe(token);
  });

  it('rejects malformed ciphertext', () => {
    expect(() => decryptTikTokToken('bad', 'a'.repeat(64))).toThrow();
  });
});
