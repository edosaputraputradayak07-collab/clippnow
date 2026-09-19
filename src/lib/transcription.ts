export type TranscriptWord = {
  text: string;
  startMs: number;
  endMs: number;
  confidence?: number;
};

export type TranscriptUtterance = {
  id: string;
  text: string;
  startMs: number;
  endMs: number;
  words: TranscriptWord[];
  speaker?: string;
  confidence?: number;
};

export type Transcript = {
  language: string;
  durationMs: number;
  utterances: TranscriptUtterance[];
};

export type TranscriptionInput = {
  sourcePath: string;
  language?: string;
};

export type TranscriptionProvider = {
  transcribe: (input: TranscriptionInput) => Promise<Transcript>;
};

function finiteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

export function normalizeTranscript(input: Transcript): Transcript {
  if (!input.language.trim()) throw new Error('TRANSCRIPT_LANGUAGE_REQUIRED');
  if (!finiteNonNegative(input.durationMs)) throw new Error('TRANSCRIPT_DURATION_INVALID');

  const utterances = [...input.utterances]
    .map((u, index) => ({
      ...u,
      id: u.id.trim() || `utt-${index + 1}`,
      text: u.text.trim().replace(/\s+/g, ' '),
      startMs: Math.max(0, u.startMs),
      endMs: Math.max(u.startMs, u.endMs),
      words: [...u.words]
        .filter((w) => w.text.trim() && finiteNonNegative(w.startMs) && finiteNonNegative(w.endMs))
        .map((w) => ({ ...w, text: w.text.trim(), startMs: Math.max(0, w.startMs), endMs: Math.max(w.startMs, w.endMs) })),
    }))
    .filter((u) => u.text.length > 0 && u.endMs > u.startMs)
    .sort((a, b) => a.startMs - b.startMs);

  return { language: input.language.trim().toLowerCase(), durationMs: input.durationMs, utterances };
}

export function transcriptText(transcript: Transcript): string {
  return transcript.utterances.map((u) => u.text).join(' ').trim();
}
