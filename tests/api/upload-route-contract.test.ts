import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const route = readFileSync(resolve(process.cwd(), 'app/api/projects/[projectId]/upload/route.ts'), 'utf8');
const client = readFileSync(resolve(process.cwd(), 'components/create/video-uploader.tsx'), 'utf8');
const media = readFileSync(resolve(process.cwd(), 'src/lib/media.ts'), 'utf8');

describe('private media upload contract', () => {
  it('requires authentication and project ownership', () => {
    expect(route).toContain("if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });");
    expect(route).toContain(".eq('user_id', user.id)");
  });

  it('uses signed upload URLs instead of routing large video bytes through Next.js', () => {
    expect(route).toContain('createSignedUploadUrl');
    expect(client).toContain('uploadToSignedUrl');
  });

  it('keeps upload paths scoped to the authenticated user and project', () => {
    expect(media).toContain('return `${userId}/${projectId}/${nonce}-${sanitizeFilename(filename)}`;');
    expect(route).toContain('body.sourcePath.startsWith(prefix)');
  });

  it('enforces the supported format and 500 MB limit', () => {
    expect(media).toContain("'video/mp4', 'video/quicktime', 'video/webm'");
    expect(media).toContain('500 * 1024 * 1024');
  });
});
