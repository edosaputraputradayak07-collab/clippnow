import crypto from 'node:crypto';
import { getYouTubeEncryptionKey } from './oauth';

export function encryptYouTubeToken(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getYouTubeEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join('.');
}

export function decryptYouTubeToken(value: string): string {
  const [ivRaw, tagRaw, ciphertextRaw] = value.split('.');
  if (!ivRaw || !tagRaw || !ciphertextRaw) throw new Error('Invalid encrypted YouTube token.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getYouTubeEncryptionKey(), Buffer.from(ivRaw, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextRaw, 'base64url')), decipher.final()]).toString('utf8');
}
