import { describe, expect, it } from 'vitest';
import { buildTranscriptionAudioArgs } from './transcription-audio';

describe('buildTranscriptionAudioArgs', () => {
  it('creates a compact mono transcription audio file', () => {
    expect(buildTranscriptionAudioArgs('/tmp/source.mp4', '/tmp/transcript.mp3')).toEqual([
      '-hide_banner', '-loglevel', 'error', '-i', '/tmp/source.mp4',
      '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'libmp3lame', '-b:a', '32k', '-y', '/tmp/transcript.mp3',
    ]);
  });
});
