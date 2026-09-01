import { describe, expect, it } from 'vitest';
import { buildFfmpegArgs } from '../../lib/rendering/ffmpeg';

describe('buildFfmpegArgs', () => {
  it('builds safe 9:16 arguments without shell interpolation', () => {
    const args = buildFfmpegArgs({ sourcePath: '/tmp/video;touch-pwned.mp4', outputPath: '/tmp/out.mp4', startSeconds: 5, durationSeconds: 12, format: '9:16' });
    expect(args).toContain('-ss');
    expect(args).toContain('5');
    expect(args).toContain('-t');
    expect(args).toContain('12');
    expect(args.join(' ')).toContain('1080:1920');
    expect(args).toContain('/tmp/video;touch-pwned.mp4');
    expect(args).toContain('/tmp/out.mp4');
  });

  it.each([
    ['1:1', '1080:1080'],
    ['16:9', '1920:1080'],
  ] as const)('uses the expected output size for %s', (format, size) => {
    const args = buildFfmpegArgs({ sourcePath: 'input.mp4', outputPath: 'output.mp4', startSeconds: 0, durationSeconds: 30, format });
    expect(args.join(' ')).toContain(size);
  });
});
