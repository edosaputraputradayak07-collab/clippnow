export interface TranscriptWord {
  start: number;
  end: number;
  word: string;
}

export function selectClipWords(words: TranscriptWord[], clipStart: number, clipEnd: number): TranscriptWord[] {
  return words
    .filter((word) => word.start < clipEnd && word.end > clipStart)
    .map((word) => ({
      ...word,
      start: Math.max(0, word.start - clipStart),
      end: Math.max(0, word.end - clipStart),
    }))
    .filter((word) => word.end > word.start);
}
