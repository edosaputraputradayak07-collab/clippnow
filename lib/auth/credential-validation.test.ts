import { describe, expect, it } from 'vitest';
import { validateLoginCredentials } from './credential-validation';

describe('validateLoginCredentials', () => {
  it('normalizes email and rejects empty credentials', () => {
    expect(validateLoginCredentials('  USER@EXAMPLE.COM ', 'password123')).toEqual({
      ok: true,
      email: 'user@example.com',
    });
    expect(validateLoginCredentials('', 'password123').ok).toBe(false);
    expect(validateLoginCredentials('user@example.com', '').ok).toBe(false);
  });

  it('rejects malformed email and short password', () => {
    expect(validateLoginCredentials('not-an-email', 'password123').ok).toBe(false);
    expect(validateLoginCredentials('user@example.com', '123').ok).toBe(false);
  });
});
