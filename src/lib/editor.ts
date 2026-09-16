import type { ContentPack } from './content-pack';

export type EditorState = {
  clipId: string;
  startMs: number;
  endMs: number;
  captionsEnabled: boolean;
  content: Pick<ContentPack, 'hook' | 'title' | 'caption' | 'cta' | 'hashtags'>;
};

export function validateEditorState(state: EditorState): string | null {
  if (!state.clipId.trim()) return 'CLIP_ID_REQUIRED';
  if (!Number.isFinite(state.startMs) || state.startMs < 0) return 'START_INVALID';
  if (!Number.isFinite(state.endMs) || state.endMs <= state.startMs) return 'END_INVALID';
  if (!state.content.hook.trim() || !state.content.title.trim() || !state.content.caption.trim()) return 'CONTENT_REQUIRED';
  if (!state.content.cta.trim()) return 'CTA_REQUIRED';
  return null;
}

export function updateTrim(state: EditorState, startMs: number, endMs: number): EditorState {
  const next = { ...state, startMs, endMs };
  const error = validateEditorState(next);
  if (error) throw new Error(`EDITOR_INVALID:${error}`);
  return next;
}

export function updateCopy(state: EditorState, patch: Partial<EditorState['content']>): EditorState {
  const next = { ...state, content: { ...state.content, ...patch } };
  const error = validateEditorState(next);
  if (error) throw new Error(`EDITOR_INVALID:${error}`);
  return next;
}

export function toggleCaptions(state: EditorState): EditorState {
  return { ...state, captionsEnabled: !state.captionsEnabled };
}

export function serializeEditorState(state: EditorState): string {
  const error = validateEditorState(state);
  if (error) throw new Error(`EDITOR_INVALID:${error}`);
  return JSON.stringify({ ...state, content: { ...state.content, hashtags: [...state.content.hashtags] } });
}
