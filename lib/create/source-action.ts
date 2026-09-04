export type SourceMode = 'upload' | 'youtube';

export function getSourceAction(mode: SourceMode): 'upload' | 'create' {
  return mode === 'youtube' ? 'upload' : 'create';
}
