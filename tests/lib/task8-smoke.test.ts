import { describe, expect, it } from 'vitest';
import { normalizeTranscript, transcriptText, type Transcript } from '../../src/lib/transcription';
import { mergeShortSegments, segmentTranscript } from '../../src/lib/segmentation';

describe('Task 8 smoke contract', () => {
  it('normalizes transcript and produces reusable segments', () => {
    const input: Transcript = {
      language: 'ID',
      durationMs: 20_000,
      utterances: [
        { id: 'a', text: '  Halo   dunia ', startMs: 0, endMs: 4_000, words: [] },
        { id: 'b', text: 'Ini konten baru', startMs: 5_500, endMs: 9_000, words: [] },
      ],
    };

    const transcript = normalizeTranscript(input);
    expect(transcriptText(transcript)).toBe('Halo dunia Ini konten baru');
    const segments = segmentTranscript(transcript, { pauseThresholdMs: 1_000 });
    expect(segments).toHaveLength(2);
    expect(mergeShortSegments(segments, 8_000)).toHaveLength(1);
  });
});
