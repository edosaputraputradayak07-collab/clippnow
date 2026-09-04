export interface ViralPackCopyInput {
  title: string;
  caption: string;
  hashtags: string[];
}

export function formatViralPackCopy(input: ViralPackCopyInput): string {
  return [input.title.trim(), input.caption.trim(), input.hashtags.join(' ').trim()]
    .filter(Boolean)
    .join('\n\n');
}
