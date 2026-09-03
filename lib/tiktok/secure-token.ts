import crypto from 'node:crypto';
const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;
function keyFromSecret(secret: string) {
  if (!/^[0-9a-fA-F]{64}$/.test(secret)) throw new Error('TIKTOK_TOKEN_ENCRYPTION_KEY must be 32-byte hex');
  return Buffer.from(secret, 'hex');
}
export function encryptTikTokToken(value: string, secret: string) {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, keyFromSecret(secret), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url');
}
export function decryptTikTokToken(payload: string, secret: string) {
  const raw = Buffer.from(payload, 'base64url');
  if (raw.length <= IV_BYTES + TAG_BYTES) throw new Error('Invalid encrypted token');
  const decipher = crypto.createDecipheriv(ALGORITHM, keyFromSecret(secret), raw.subarray(0, IV_BYTES));
  decipher.setAuthTag(raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
  return Buffer.concat([decipher.update(raw.subarray(IV_BYTES + TAG_BYTES)), decipher.final()]).toString('utf8');
}
export function getTikTokTokenKey() {
  const secret = process.env.TIKTOK_TOKEN_ENCRYPTION_KEY;
  if (!secret) throw new Error('TikTok integration is not configured');
  return secret;
}
