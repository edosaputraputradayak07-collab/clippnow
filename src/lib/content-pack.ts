import type { ContentMode } from './types/core';
import type { ScoredClipCandidate } from './scoring';

export type ContentPack = {
  mode: ContentMode;
  hook: string;
  title: string;
  caption: string;
  cta: string;
  hashtags: string[];
  angle: string;
  rationale: string;
};

export type ContentPackInput = { candidate: ScoredClipCandidate; mode: ContentMode };
export type LLMProvider = { generateContentPack: (input: ContentPackInput) => Promise<ContentPack> };

const MODE_RULES: Record<ContentMode, { cta: string; tags: string[]; angle: string }> = {
  affiliate: { cta: 'Cek produknya dan bandingkan manfaat serta harganya sebelum beli.', tags: ['affiliate', 'racunbelanja', 'rekomendasi'], angle: 'Manfaat produk dan alasan orang mempertimbangkan untuk membeli.' },
  seller: { cta: 'Cek produknya, pesan lewat toko, dan tanyakan detail yang kamu butuhkan.', tags: ['umkm', 'jualanonline', 'produk'], angle: 'Masalah pelanggan → solusi produk → bukti → ajakan bertanya atau membeli.' },
  live_seller: { cta: 'Kalau mau, langsung checkout sekarang atau tulis pertanyaanmu di komentar.', tags: ['liveselling', 'jualanlive', 'promo'], angle: 'Energi live, objection handling, urgensi promo, dan closing.' },
  podcast: { cta: 'Kalau insight ini berguna, simpan dan bagikan ke orang yang sedang membutuhkannya.', tags: ['podcast', 'insight', 'cerita'], angle: 'Potongan dialog yang memiliki gagasan, cerita, opini, atau punchline yang berdiri sendiri.' },
  educator: { cta: 'Simpan video ini dan follow untuk tips atau pembahasan berikutnya.', tags: ['edukasi', 'belajar', 'tips'], angle: 'Penjelasan yang dapat dipahami sebagai satu pelajaran dengan takeaway yang jelas.' },
};

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function firstSentence(text: string): string {
  const sentence = clean(text).split(/[.!?]/)[0];
  return sentence || clean(text);
}

function makeHook(text: string, mode: ContentMode): string {
  const lead = firstSentence(text);
  const prefixes: Record<ContentMode, string> = {
    affiliate: 'Sebelum beli, kamu perlu tahu ini:', seller: 'Kalau pelanggan sering bingung, mulai dari ini:',
    live_seller: 'Jangan lewatkan bagian ini saat live:', podcast: 'Ada satu hal menarik dari obrolan ini:',
    educator: 'Ini cara memahaminya dengan lebih sederhana:',
  };
  return clean(`${prefixes[mode]} ${lead}`);
}

function makeTitle(text: string, mode: ContentMode): string {
  const lead = firstSentence(text);
  const labels: Record<ContentMode, string> = {
    affiliate: 'Yang perlu dicek sebelum beli', seller: 'Cara menjelaskan produk dengan jelas', live_seller: 'Momen penting saat jualan live', podcast: 'Insight dari sebuah percakapan', educator: 'Pelajaran singkat yang bisa dipakai',
  };
  return clean(`${labels[mode]}: ${lead}`).slice(0, 100);
}

export function buildContentPack(candidate: ScoredClipCandidate, mode: ContentMode): ContentPack {
  const rules = MODE_RULES[mode];
  const source = clean(candidate.text);
  if (!source) throw new Error('CONTENT_SOURCE_REQUIRED');
  const hook = makeHook(source, mode);
  const title = makeTitle(source, mode);
  const caption = clean(`${source} ${rules.cta}`);
  const hashtags = [...new Set([...rules.tags, `#${mode}`])].map((tag) => tag.startsWith('#') ? tag : `#${tag}`).slice(0, 8);
  return {
    mode,
    hook,
    title,
    caption,
    cta: rules.cta,
    hashtags,
    angle: rules.angle,
    rationale: `Dipilih karena skor AI ${candidate.score.toFixed(1)} dengan relevansi mode ${(candidate.signals.modeRelevance * 100).toFixed(0)}% dan durasi ${Math.round(candidate.durationMs / 1000)} detik.`,
  };
}

export function createDeterministicLLMProvider(): LLMProvider {
  return { generateContentPack: async ({ candidate, mode }) => buildContentPack(candidate, mode) };
}

export const CONTENT_PACK_MODE_RULES = MODE_RULES;
