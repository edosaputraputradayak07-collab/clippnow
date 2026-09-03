import { describe, expect, it } from 'vitest';
import { buildFfmpegArgs } from './ffmpeg';

describe('buildFfmpegArgs', () => {
  it('adds visible short-form enhancement filters for viral edits', () => {
    const args = buildFfmpegArgs({
      sourcePath: '/tmp/source.mp4',
      outputPath: '/tmp/output.mp4',
      startSeconds: 2,
      durationSeconds: 30,
      format: '9:16',
      effects: ['motion-zoom', 'beat-flash', 'impact-shake', 'jump-cut'],
    });

    const filter = args[args.indexOf('-vf') + 1];
    expect(filter).toContain('zoompan');
    expect(filter).toContain('eq=contrast=1.08:saturation=1.12');
    expect(filter).toContain('brightness=');
    expect(filter).toContain('unsharp=');
  });
});
