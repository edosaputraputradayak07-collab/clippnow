import { describe, expect, it } from 'vitest';
import { analyzeTranscriptForMode } from '../../src/lib/content-analysis';
import type { Transcript } from '../../src/lib/transcription';

const transcript: Transcript = {
  language: 'id',
  durationMs: 90000,
  utterances: [
    { id:'u1', text:'Ini cara memilih produk yang bagus', startMs:0, endMs:5000, words:[] },
    { id:'u2', text:'Bandingkan harga dan manfaat sebelum beli', startMs:7000, endMs:12000, words:[] },
    { id:'u3', text:'Menurut pengalaman saya, ini insight penting', startMs:20000, endMs:26000, words:[] },
  ],
};

describe('content analysis integration', () => {
  it('produces scored candidates for the requested mode', () => {
    const result = analyzeTranscriptForMode(transcript, 'affiliate');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].score).toBeGreaterThan(0);
    expect(result[0].startMs).toBeLessThan(result[0].endMs);
  });

  it('keeps analysis deterministic for the same transcript and mode', () => {
    expect(analyzeTranscriptForMode(transcript, 'educator'))
      .toEqual(analyzeTranscriptForMode(transcript, 'educator'));
  });
});
