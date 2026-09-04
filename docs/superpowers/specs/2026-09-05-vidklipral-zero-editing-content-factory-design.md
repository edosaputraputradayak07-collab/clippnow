# Vidklipral Zero-Editing Content Factory Design

## Goal
Transform Vidklipral from a clip generator into a low-friction AI content factory: a creator uploads one video, AI finds and edits the strongest moments, then produces ready-to-post videos plus platform-specific titles, captions, hashtags, keywords, and CTAs.

## Product principle
**Upload once. Let Vidklipral do the editing.** Manual editing remains available as an optional escape hatch, not a required step.

## User flow
1. **Source** — user chooses a local video file. YouTube links remain preview/reference only; Vidklipral does not download or scrape YouTube content automatically.
2. **Goal** — default to Auto, with platform options TikTok, Instagram Reels, YouTube Shorts, and Facebook Reels where publishing support is available.
3. **Style** — default Auto, with Viral, Podcast, Funny, Business, Education, Product, Gaming, Music, and Vlog presets.
4. **Create** — one primary action starts upload, transcription, viral-moment detection, editing, rendering, and content-pack generation.
5. **Results** — show 5–10 ranked clips with previews, viral scores, processing status, and ready/download actions. The user can download one MP4 or all completed clips.
6. **Viral Pack** — each completed clip receives multiple title candidates, a platform-specific caption, hashtags, SEO keywords, and CTA. Copy actions are one tap.
7. **Publish** — provide official platform publishing integrations only where supported and authorized by the user. Never claim or guarantee virality.

## AI pipeline
`upload -> transcription -> transcript/segment scoring -> candidate selection -> clip planning -> format/reframe -> speaker/face-aware crop when feasible -> captions -> keyword emphasis -> motion/zoom/effects -> optional B-roll/music/SFX -> hook/CTA treatment -> FFmpeg render -> output validation -> Viral Pack generation -> ready`

The first implementation should reuse the existing transcription, viral-plan, batch-project, private-storage, signed-output, and FFmpeg infrastructure instead of introducing a second rendering system.

## Viral scoring
The score is a recommendation signal, not a guarantee. Candidate ranking should consider hook strength, curiosity, emotional intensity, question/punchline structure, useful information, transcript density, and duration suitability for the selected goal. Scores remain bounded to 0–100.

## Editing presets
Presets change the edit plan rather than requiring a new rendering architecture:
- **Auto/Viral:** strongest hook, dynamic captions, restrained zoom/motion, punch emphasis.
- **Podcast:** speaker-focused crop, readable captions, cleaner transitions.
- **Funny:** punchline emphasis and timing-sensitive captions/effects.
- **Business/Education:** clarity-first captions and restrained motion.
- **Product:** benefit/hook emphasis, product-friendly framing, CTA.
- **Gaming/Music/Vlog:** goal-specific caption and motion treatment while preserving source audio intent.

## Viral Pack contract
For each clip and platform, generate:
- 3 title candidates where the platform supports titles.
- 1 concise caption.
- 5–10 relevant hashtags, avoiding spammy repetition.
- 3–8 searchable keywords.
- 1 CTA.
- A short reason explaining the selected hook/angle.

Copy should be generated from the actual transcript/edit plan, not invented unrelated claims. The system must avoid guarantees such as “pasti FYP” or “pasti viral.”

## Batch behavior and credits
The existing batch maximum remains 10. The initial project already reserves one credit for non-owner users; additional child clips reserve additional credits. Owner plan remains unlimited. Partial failures must release only credits that were reserved for failed child jobs.

## Publishing and platform compliance
- YouTube input remains an official embedded preview/reference path. No automated downloader, scraper, or re-upload pipeline is introduced.
- TikTok/Instagram/YouTube/Facebook publishing must use official APIs or user-driven upload flows and explicit authorization where required.
- If an official publishing API is unavailable, the product falls back to download + copy-ready content pack.

## UX requirements
- Mobile-first source selection with a native file picker.
- One primary action per stage.
- Progress language must explain what AI is doing without exposing technical complexity.
- Results should prioritize completed clips and make download/copy actions obvious.
- Manual editor controls remain secondary.

## Reliability and security
- Preserve private source/output storage and short-lived signed output URLs.
- Keep provider/API credentials server-side.
- Preserve origin checks, authentication, ownership checks, rate limits, and credit idempotency.
- Do not create offensive/retaliatory security behavior; defense means detection, throttling, isolation, logging, and access control.
- Render jobs must remain lease/worker safe and stale workers must not finalize a job they no longer own.

## Acceptance criteria
- A logged-in creator can upload a supported video from mobile or desktop without the picker being blocked.
- One primary action can produce a batch of 5, 8, or 10 planned clips from a sufficiently long source.
- Each clip can render to MP4 using the existing private-storage pipeline.
- Completed clips expose download actions without requiring manual timeline editing.
- Each completed clip has a usable Viral Pack with platform-specific copy and no unsupported virality guarantee.
- YouTube preview never becomes an automatic downloader.
- Existing authentication, credit, ownership, storage, and render security constraints remain intact.
- Automated tests, TypeScript, web build, and production deployment checks pass before completion.
