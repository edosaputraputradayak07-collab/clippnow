import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Task 5 source contract', () => {
  it('supports upload and YouTube sources without TikTok downloading', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/lib/projects/contracts.ts'), 'utf8');
    expect(source).toContain("['upload', 'youtube']");
    expect(source).not.toContain('tiktok');
  });
});
