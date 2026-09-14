import type { ContentMode, ModeConfig } from './types/core';

export const MODE_CONFIGS: Record<ContentMode, ModeConfig> = {
  affiliate: { id: 'affiliate', label: 'TikTok Affiliate', description: 'Hook, manfaat, konversi, dan CTA.', signals: ['hook', 'benefit', 'conversion', 'cta'] },
  seller: { id: 'seller', label: 'Seller / UMKM', description: 'Produk, masalah-solusi, bukti, promo, dan CTA.', signals: ['product', 'problem_solution', 'proof', 'promotion', 'cta'] },
  live_seller: { id: 'live_seller', label: 'Live Seller', description: 'Produk, Q&A, objection, reaksi, promo, dan closing.', signals: ['product', 'question', 'objection', 'answer', 'reaction', 'promotion', 'closing'] },
  podcast: { id: 'podcast', label: 'Podcaster', description: 'Insight, cerita, opini, punchline, dan konteks.', signals: ['insight', 'story', 'opinion', 'punchline', 'context'] },
  educator: { id: 'educator', label: 'Educator / Personal Brand', description: 'Tips, tutorial, fakta, Q&A, dan takeaway.', signals: ['tips', 'tutorial', 'facts', 'qa', 'takeaway'] },
};

export function getModeConfig(mode: ContentMode): ModeConfig {
  return MODE_CONFIGS[mode];
}
