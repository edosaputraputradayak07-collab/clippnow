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

    const filterGraph = args.join(' ');
    expect(filterGraph).toContain('subtitles=/tmp/captions.ass');
    expect(filterGraph).toContain('zoompan');
  });

  it('normalizes audio only when the auto-edit pipeline requests it', () => {
    const args = buildFfmpegArgs({
      sourcePath: '/tmp/source.mp4',
      outputPath: '/tmp/output.mp4',
      startSeconds: 0,
      durationSeconds: 10,
      format: '9:16',
      normalizeAudio: true,
    });

    expect(args.join(' ')).toContain('loudnorm=I=-14:TP=-1.5:LRA=11');
  });
});
