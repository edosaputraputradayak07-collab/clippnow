import { describe, expect, it } from 'vitest';
import { createTikTokMediaSignature, verifyTikTokMediaSignature } from './media-signature';

describe('TikTok media signatures', () => {
  it('creates a signature that verifies for the same project and expiry', () => {
    const expiresAt = Math.floor(Date.now() / 1000) + 300;
    const signature = createTikTokMediaSignature('project-123', expiresAt, 'test-secret');
    expect(verifyTikTokMediaSignature('project-123', expiresAt, signature, 'test-secret', Math.floor(Date.now() / 1000))).toBe(true);
  });

  it('rejects a different project, tampering, or expired signature', () => {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 300;
    const signature = createTikTokMediaSignature('project-123', expiresAt, 'test-secret');
    expect(verifyTikTokMediaSignature('project-999', expiresAt, signature, 'test-secret', now)).toBe(false);
    expect(verifyTikTokMediaSignature('project-123', expiresAt, `${signature}x`, 'test-secret', now)).toBe(false);
    expect(verifyTikTokMediaSignature('project-123', now - 1, signature, 'test-secret', now)).toBe(false);
  });
});
