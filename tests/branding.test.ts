import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const files = ['app/auth/login/page.tsx', 'app/dashboard/page.tsx', 'app/dashboard/create/create-studio.tsx'];

describe('Vidklipral user-facing branding', () => {
  it('keeps the official Vidklipral brand on user-facing surfaces', () => {
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      expect(content, file).toContain('Vidklipral');
      expect(content, file).not.toContain('ClippNow');
      expect(content, file).not.toContain('ClippNowe');
    }
  });
});
