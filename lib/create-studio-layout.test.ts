import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('create studio layout', () => {
  it('uses the single native create studio without a legacy provider panel', () => {
    const page = readFileSync(join(process.cwd(), 'app/dashboard/create/page.tsx'), 'utf8');
    const studio = readFileSync(join(process.cwd(), 'app/dashboard/create/create-studio.tsx'), 'utf8');

    expect(page).not.toContain('YouTubeImportStudio');
    expect(page).not.toContain('youtube-import-studio');
    expect(studio).not.toContain('LumiClip');
    expect(studio).not.toContain('lumiclip');
    expect(studio).toContain('Preview YouTube aktif');
  });
});
