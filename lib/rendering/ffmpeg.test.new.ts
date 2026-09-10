import { describe, expect, it } from 'vitest';
import { buildFfmpegArgs } from './ffmpeg';

describe('buildFfmpegArgs motion zoom', () => {
  it('uses duration-aware smooth crop instead of zoompan', () => {
    const args = buildFfmpegArgs({ sourcePath: '/tmp/source.mp4', outputPath: '/tmp/output.mp4', startSeconds: 2, durationSeconds: 30, format: '9:16', effects: ['motion-zoom'] });
    const filter = args[args.indexOf('-vf') + 1];
    expect(filter).toContain("crop=w='iw/(1+0.08*min(t/30,1))'");
    expect(filter).not.toContain('zoompan');
  });
});
