export type ViralPackPlatform = 'tiktok' | 'instagram-reels' | 'youtube-shorts' | 'facebook-reels';

export interface ViralPackInput {
  platform: ViralPackPlatform;
  title: string;
  transcript: string;
  score: number;
}

export interface ViralPack {
  titles: [string, string, string];
  caption: string;
  hashtags: string[];
  keywords: string[];
  cta: string;
  angle: string;
}

const STOP_WORDS = new Set([
  'yang', 'dan', 'atau', 'untuk', 'dari', 'dengan', 'ini', 'itu', 'jadi', 'saya', 'kamu', 'kita', 'mereka',
  'akan', 'bisa', 'lebih', 'sudah', 'saja', 'karena', 'kalau', 'dalam', 'pada', 'ada', 'tidak', 'jangan',
  'the', 'and', 'for', 'with', 'this', 'that', 'you', 'your', 'are', 'was', 'have', 'has', 'how', 'what',
]);

const GUARANTEE = /\b(pasti\s+(viral|fyp)|dijamin\s+(viral|fyp)|jaminan\s+(viral|fyp)|guaranteed\s+viral)\b/gi;

function cleanText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function sentenceSeed(transcript: string, title: string) {
  const text = cleanText(transcript) || cleanText(title) || 'Cerita ini';
  const sentence = text.split(/(?<=[.!?])\s+/)[0] ?? text;
  return sentence.slice(0, 100).replace(/[.!?]+$/, '').trim() || 'Cerita ini';
}

function keywordsFrom(text: string) {
  const words = text.toLowerCase().replace(/[^\p{L}\p{N}% ]/gu, ' ').split(/\s+/).filter(Boolean);
  const unique: string[] = [];
  for (const word of words) {
    if (word.length < 4 || STOP_WORDS.has(word) || unique.includes(word)) continue;
    unique.push(word);
    if (unique.length === 8) break;
  }
  return unique.length ? unique : ['video', 'cerita', 'tips'];
}

function hashtagsFor(platform: ViralPackPlatform, keywords: string[]) {
  const platformTags: Record<ViralPackPlatform, string[]> = {
    tiktok: ['#fyp', '#fypindonesia', '#tiktokindonesia'],
    'instagram-reels': ['#reels', '#reelsindonesia', '#exploreindonesia'],
    'youtube-shorts': ['#shorts', '#youtubeshorts', '#shortsindonesia'],
    'facebook-reels': ['#reels', '#facebookreels', '#indonesia'],
  };
  const topicTags = keywords.slice(0, 5).map(word => `#${word.replace(/[^\p{L}\p{N}]/gu, '')}`).filter(tag => tag.length > 1);
  return [...new Set([...platformTags[platform], ...topicTags])].slice(0, 10);
}

function withoutGuarantee(value: string) {
  return cleanText(value.replace(GUARANTEE, 'menarik untuk ditonton'));
}

export function buildViralPack(input: ViralPackInput): ViralPack {
  const seed = sentenceSeed(input.transcript, input.title);
  const keywords = keywordsFrom(`${seed} ${input.title}`);
  const topic = keywords.slice(0, 2).join(' dan ') || 'topik ini';
  const score = Math.max(0, Math.min(100, Math.round(input.score)));
  const titles: [string, string, string] = [
    `${seed} — Ini yang Perlu Kamu Tahu`,
    `Kenapa ${topic} Ini Menarik Perhatian?`,
    `${seed} 😳`,
  ];

  const captionByPlatform: Record<ViralPackPlatform, string> = {
    tiktok: `${seed}. Simak sampai selesai dan lihat bagian yang paling menarik.`,
    'instagram-reels': `${seed}. Bagian ini paling layak kamu simak sampai akhir.`,
    'youtube-shorts': `${seed}. Potongan singkat dengan inti pembahasan yang mudah diikuti.`,
    'facebook-reels': `${seed}. Apa pendapatmu setelah melihat bagian ini?`,
  };
  const ctaByPlatform: Record<ViralPackPlatform, string> = {
    tiktok: 'Menurut kamu gimana? Tulis di komentar 👇',
    'instagram-reels': 'Simpan dan bagikan kalau menurutmu ini berguna.',
    'youtube-shorts': 'Tulis pendapatmu di komentar dan subscribe untuk video berikutnya.',
    'facebook-reels': 'Bagikan ke teman yang mungkin tertarik dengan topik ini.',
  };

  return {
    titles: titles.map(withoutGuarantee) as [string, string, string],
    caption: withoutGuarantee(`${captionByPlatform[input.platform]} ${ctaByPlatform[input.platform]}`),
    hashtags: hashtagsFor(input.platform, keywords),
    keywords,
    cta: ctaByPlatform[input.platform],
    angle: `Angle: ${seed}. Viral score rekomendasi ${score}/100 berdasarkan sinyal hook dan isi transcript; bukan jaminan performa.`,
  };
}
