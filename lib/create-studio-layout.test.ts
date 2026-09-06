import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('create studio layout', () => {
  it('does not render the legacy provider-backed YouTube import panel', () => {
    const page = readFileSync(join(process.cwd(), 'app/dashboard/create/page.tsx'), 'utf8');
    const legacyComponent = readFileSync(join(process.cwd(), 'app/dashboard/create/youtube-import-studio.tsx'), 'utf8');

    expect(page).not.toContain('YouTubeImportStudio');
    expect(page).not.toContain('youtube-import-studio');
    expect(legacyComponent).not.toContain('lumiclip');
    expect(legacyComponent).not.toContain('LumiClip');
  });
});
