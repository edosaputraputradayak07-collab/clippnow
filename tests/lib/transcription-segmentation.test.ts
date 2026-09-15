import { describe, expect, it } from 'vitest';
import { normalizeTranscript, transcriptText, type Transcript } from '../../src/lib/transcription';
import { mergeShortSegments, segmentTranscript } from '../../src/lib/segmentation';

const transcript: Transcript = {
  language: 'ID',
  durationMs: 30_000,
  utterances: [
    { id: '1', text: '  Halo   semuanya ', startMs: 0, endMs: 2_000, words: [] },
    { id: '2', text: 'Ini produk yang saya rekomendasikan.', startMs: 2_200, endMs: 5_000, words: [] },
    { id: '3', text: 'Harganya sedang promo hari ini.', startMs: 7_000, endMs: 9_000, words: [] },
    { id: '4', text: 'Kalau tertarik, cek linknya.', startMs: 15_000, endMs: 18_000, words: [] },
  ],
};

describe('transcription normalization', () => {
  it('normalizes language, whitespace and ordering', () => {
    const normalized = normalizeTranscript({ ...transcript, utterances: [...transcript.utterances].reverse() });
    expect(normalized.language).toBe('id');
    expect(normalized.utterances[0].text).toBe('Halo semuanya');
    expect(transcriptText(normalized)).toContain('Halo semuanya Ini produk');
  });

  it('rejects invalid transcript metadata', () => {
    expect(() => normalizeTranscript({ ...transcript, language: ' ' })).toThrow('TRANSCRIPT_LANGUAGE_REQUIRED');
    expect(() => normalizeTranscript({ ...transcript, durationMs: -1 })).toThrow('TRANSCRIPT_DURATION_INVALID');
  });
});

describe('content segmentation', () => {
  it('creates semantic-ish boundaries at long pauses', () => {
    const segments = segmentTranscript(transcript, { pauseThresholdMs: 3_000 });
    expect(segments).toHaveLength(2);
    expect(segments[0].text).toContain('produk');
    expect(segments[1].text).toContain('linknya');
    expect(segments[0].durationMs).toBe(9_000);
  });

  it('splits when duration or word budget is exceeded', () => {
    const segments = segmentTranscript(transcript, { pauseThresholdMs: 100_000, maxDurationMs: 6_000 });
    expect(segments.length).toBeGreaterThan(1);
    expect(segments.every((segment) => segment.durationMs <= 7_000)).toBe(true);
  });

  it('merges short segments without losing timestamps or text', () => {
    const segments = segmentTranscript(transcript, { pauseThresholdMs: 3_000 });
    const merged = mergeShortSegments(segments, 10_000);
    expect(merged).toHaveLength(1);
    expect(merged[0].startMs).toBe(0);
    expect(merged[0].endMs).toBe(18_000);
    expect(merged[0].text).toContain('linknya');
  });
});
