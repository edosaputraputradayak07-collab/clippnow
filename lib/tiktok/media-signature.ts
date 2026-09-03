import { createHmac, timingSafeEqual } from 'node:crypto';

function digest(projectId: string, expiresAt: number, secret: string) {
  return createHmac('sha256', secret).update(`${projectId}.${expiresAt}`).digest('hex');
}

export function createTikTokMediaSignature(projectId: string, expiresAt: number, secret: string) {
  return digest(projectId, expiresAt, secret);
}

export function verifyTikTokMediaSignature(projectId: string, expiresAt: number, signature: string, secret: string, now = Math.floor(Date.now() / 1000)) {
  if (!Number.isInteger(expiresAt) || expiresAt <= now || !/^[a-f0-9]{64}$/.test(signature)) return false;
  const expected = digest(projectId, expiresAt, secret);
  return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signature, 'utf8'));
}

export function getTikTokMediaSigningSecret() {
  const secret = process.env.TIKTOK_MEDIA_SIGNING_SECRET;
  if (!secret || secret.length < 32) throw new Error('TIKTOK_MEDIA_SIGNING_SECRET must be at least 32 characters');
  return secret;
}
