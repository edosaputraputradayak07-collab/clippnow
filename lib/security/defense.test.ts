import { describe, expect, it } from 'vitest';
import { getClientIp, securityHeaders } from './defense-core';

describe('ClippNow security defense', () => {
  it('prefers trusted proxy headers in order', () => {
    const headers = new Headers({ 'x-vercel-forwarded-for': '203.0.113.10, 198.51.100.4', 'x-forwarded-for': '198.51.100.8' });
    expect(getClientIp(headers)).toBe('203.0.113.10');
  });

  it('falls back to x-forwarded-for and strips a port', () => {
    const headers = new Headers({ 'x-forwarded-for': '198.51.100.20:443, 198.51.100.21' });
    expect(getClientIp(headers)).toBe('198.51.100.20');
  });

  it('returns hardened browser security headers', () => {
    const headers = securityHeaders();
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['Permissions-Policy']).toContain('camera=()');
  });
});
