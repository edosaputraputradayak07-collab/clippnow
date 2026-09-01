import type { RenderJobStatus } from './types';

export const RENDER_JOB_STATUSES: readonly RenderJobStatus[] = ['queued','processing','completed','failed'];
const ALLOWED: Record<RenderJobStatus, readonly RenderJobStatus[]> = { queued:['processing'], processing:['completed','failed'], completed:[], failed:['queued'] };
export function canTransition(from: RenderJobStatus, to: RenderJobStatus): boolean { return ALLOWED[from]?.includes(to) ?? false; }
export function assertTransition(from: RenderJobStatus, to: RenderJobStatus): void { if (!canTransition(from,to)) throw new Error(`Invalid render job transition: ${from} -> ${to}`); }
