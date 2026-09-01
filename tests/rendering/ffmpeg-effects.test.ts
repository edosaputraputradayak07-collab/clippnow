import { describe, expect, it } from 'vitest';
import { buildFfmpegArgs } from '../../lib/rendering/ffmpeg';

describe('viral render options', () => {
  it('adds an ASS subtitle filter and motion zoom when requested', () => {
    const args = buildFfmpegArgs({
      sourcePath: '/tmp/source.mp4',
      outputPath: '/tmp/output.mp4',
      startSeconds: 0,
      durationSeconds: 10,
      format: '9:16',
      subtitlePath: '/tmp/captions.ass',
      effects: ['motion-zoom'],
    });

    expect(args).toContain('subtitles=/tmp/captions.ass');
    expect(args.join(' ')).toContain('zoompan');
  });
});
