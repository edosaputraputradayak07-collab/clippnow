import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const files = ['app/auth/login/page.tsx', 'app/dashboard/page.tsx', 'app/dashboard/create/create-studio.tsx'];

describe('ClippNow user-facing branding', () => {
  it('does not expose the legacy Vidklipral brand', () => {
    for (const file of files) {
      expect(readFileSync(file, 'utf8'), file).not.toContain('Vidklipral');
    }
  });
});
