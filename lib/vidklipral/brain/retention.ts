export type TranscriptSegment = {
  startSeconds: number;
  endSeconds: number;
  text: string;
};

export type RetentionShape = {
  hasHook: boolean;
  hasContext: boolean;
  hasEscalation: boolean;
  hasPayoff: boolean;
  confidence: number;
};

function validSegment(segment: TranscriptSegment): boolean {
  return Number.isFinite(segment.startSeconds)
    && Number.isFinite(segment.endSeconds)
    && segment.endSeconds > segment.startSeconds
    && segment.text.trim().length > 0;
}

function normalize(segments: TranscriptSegment[]): TranscriptSegment[] {
  return segments
    .filter(validSegment)
    .map((segment) => ({
      startSeconds: Math.max(0, segment.startSeconds),
      endSeconds: Math.max(0, segment.endSeconds),
      text: segment.text.trim().replace(/\s+/g, ' '),
    }))
    .filter((segment) => segment.endSeconds > segment.startSeconds)
    .sort((a, b) => a.startSeconds - b.startSeconds);
}

function hasHookText(text: string): boolean {
  return /\?|rahasia|tidak akan|bayangkan|ternyata|yang terjadi|kesalahan|jangan|tidak percaya|how|why|what if/i.test(text);
}

function hasContextText(text: string): boolean {
  return /saya|kami|dia|mereka|ketika|sebelum|setelah|karena|bisnis|cerita|pengalaman|mulai|awal|dulu|tahun|bulan/i.test(text);
}

function hasEscalationText(text: string): boolean {
  return /lalu|kemudian|tapi|namun|akhirnya|naik|turun|berubah|masalah|terjadi|semakin|lebih|kali|juta|ribu|hasilnya/i.test(text);
}

function hasPayoffText(text: string): boolean {
  return /itulah|jadi|makanya|alasan|pelajaran|kesimpulannya|akhirnya|hasilnya|sekarang|karena itu|yang penting/i.test(text);
}

export function classifyRetentionShape(segments: TranscriptSegment[]): RetentionShape {
  const normalized = normalize(segments);
  if (normalized.length === 0) {
    return { hasHook: false, hasContext: false, hasEscalation: false, hasPayoff: false, confidence: 0 };
  }

  const texts = normalized.map((segment) => segment.text);
  const hasHook = hasHookText(texts.slice(0, Math.max(1, Math.ceil(texts.length * 0.3))).join(' '));
  const hasContext = hasContextText(texts.slice(0, Math.max(1, Math.ceil(texts.length * 0.6))).join(' '));
  const middleStart = Math.floor(texts.length * 0.2);
  const middleEnd = Math.max(middleStart + 1, Math.ceil(texts.length * 0.85));
  const hasEscalation = hasEscalationText(texts.slice(middleStart, middleEnd).join(' '));
  const hasPayoff = hasPayoffText(texts.slice(Math.floor(texts.length * 0.55)).join(' '));

  const matches = [hasHook, hasContext, hasEscalation, hasPayoff].filter(Boolean).length;
  return {
    hasHook,
    hasContext,
    hasEscalation,
    hasPayoff,
    confidence: Number((matches / 4).toFixed(4)),
  };
}
