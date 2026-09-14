# AI Content Engine — Product Design Specification

**Date:** 2026-09-15  
**Status:** Design approved for implementation planning  
**Product:** AI-first content repurposing web application

## 1. Product vision

Build a mobile-first web product that turns one long video into multiple short-form content assets. The product is positioned as an **AI Content Engine**, not merely a video cutter.

Core promise:

> **1 Video → Banyak Konten → Banyak Tujuan**

Primary user modes:
1. TikTok Affiliate
2. Seller / UMKM
3. Live Seller
4. Podcaster
5. Educator / Personal Brand

The five modes share one AI pipeline. A mode changes scoring priorities and generated copy, not the underlying processing architecture.

## 2. Product principles

- Experience first: a new user can upload/paste a source, choose a mode, process it, and preview results before mandatory registration.
- Result before account: authentication is requested when saving/downloading at gated quality, creating more work, or purchasing credits.
- One simple primary action: **Buat Konten**.
- AI performs most editing; the user corrects the final result rather than learning a full professional editor.
- Mobile-first UX, responsive desktop support.
- Free trial is designed to demonstrate value; paid usage is credit-based initially.
- Do not promise that an AI score guarantees virality.
- Respect copyright, platform terms, and user rights to source content.

## 3. Core user flow

```text
Landing
  → Upload video OR supported URL
  → Select one of five modes
  → Create content
  → Job progress
  → AI-found candidate moments
  → Select all or individual moments
  → Generate clips
  → Render
  → Content Pack
  → Preview / Edit / Download
  → Login when account-gated action is required
  → Buy credits when free allowance is exhausted
```

## 4. Input sources

V1 supports:
- Direct video upload (common video formats such as MP4/MOV/WebM subject to configured limits).
- YouTube URL, subject to technical availability and applicable rights/terms.

Do not make TikTok downloading a core dependency in V1. Future platform integrations must be evaluated for technical and rights/terms constraints.

## 5. Five AI modes

### Affiliate
Prioritize hook, product relevance, benefit, conversion intent, CTA, and retention potential. Generate short clips plus hook, title, caption, CTA, and optional hashtag suggestions.

### Seller / UMKM
Prioritize product showcase, problem/solution, benefits, price/promotion when actually stated, proof/testimonial, and purchase CTA. Output promotional content variants.

### Live Seller
Optimized for long live-commerce recordings. Detect product mentions, questions, objections, answers, reactions, promotions, and closing moments. One long live can produce a large content pack, subject to credit and configured limits.

### Podcast
Prioritize insight, context, punchline, story, strong opinion, emotion, Q&A, and quotability. Preserve enough context so clips do not feel arbitrarily cut.

### Educator / Personal Brand
Prioritize information density, clarity, tutorial steps, mistakes, facts, myth/fact, Q&A, storytelling, and key takeaways.

## 6. AI processing pipeline

```text
VIDEO
 → media ingest / metadata
 → audio extraction
 → transcription with timestamps
 → semantic segmentation
 → content understanding
 → candidate moment generation
 → mode-specific scoring
 → diversity / duplicate suppression
 → candidate list
 → clip generation
 → captions
 → 9:16 reframe
 → optional headline / CTA overlays
 → render
 → storage
 → Content Pack
```

Heavy work runs asynchronously in workers. The Next.js web application must not hold an HTTP request open for full video processing.

## 7. Candidate scoring

Candidate metadata should include, where applicable:
- hook score
- clarity score
- context score
- emotion score
- information/content score
- engagement potential
- CTA/conversion score
- mode relevance
- overall score

Weights are mode-dependent. The system should also apply diversity rules so several nearly identical clips are not returned.

Scores are recommendations, not guarantees of performance.

## 8. Transcript and segment reuse

Store transcript and analyzed segments independently from generated clips. If a user switches mode after initial analysis, reuse transcript/segment data and re-score candidates rather than reprocessing the original video whenever possible. This reduces latency and cost.

## 9. Clip output

V1 output:
- 3–5 recommended clips initially, configurable upward by plan/cost.
- Vertical 9:16 output.
- Indonesian auto captions.
- Automatic reframing.
- Preview.
- Download.

Content Pack metadata for each clip:
- video asset
- thumbnail
- hook
- title
- caption
- CTA when relevant
- category/mode
- score

Future formats can include 1:1, 4:5, and 16:9.

## 10. Editor scope

V1 is intentionally not a CapCut replacement. Provide lightweight corrections:
- trim start/end
- caption style/position/font/size
- reframe/crop
- watermark/logo
- headline
- CTA

## 11. UX and pages

Routes / screens:
- `/` — landing + create
- `/create` — source and mode selection
- `/project/:id` — processing state and analysis
- `/project/:id/clips` — candidate/results list
- `/project/:id/editor/:clipId` — lightweight editor
- `/dashboard` — user projects
- `/credits` — credit balance and purchases
- `/pricing` — packages
- `/login` — Google/email authentication
- `/settings` — account settings

Navigation after login: Home, Projects, Create, Credits, Profile.

## 12. Authentication

Authentication is optional at the beginning of the journey. Google login is the preferred low-friction option. Email/password may be supported. TikTok/Facebook OAuth are not required for V1.

Account becomes relevant for persistent history, gated downloads, larger processing, and purchases.

## 13. Job state machine

```text
QUEUED
 → DOWNLOADING
 → TRANSCRIBING
 → ANALYZING
 → SELECTING
 → GENERATING
 → RENDERING
 → COMPLETED
```

Any stage may transition to `FAILED` after bounded retries. Failed paid jobs must refund reserved credits according to the credit ledger rules.

## 14. Reliability

- Async queue and worker model.
- Bounded automatic retries for transient failures.
- Idempotency keys for create/generate operations.
- Job locking to prevent duplicate processing.
- Explicit terminal states.
- Operational logs and admin retry/refund tools.

## 15. Technical architecture

Recommended stack:
- Next.js for web UI, server-side API/orchestration, and account/dashboard surfaces.
- Supabase PostgreSQL for application data.
- Supabase Auth for authentication.
- Supabase Storage for private source/output assets where appropriate.
- Managed queue/Redis-compatible queue for background jobs.
- Worker service for transcription orchestration, AI analysis, and video processing.
- FFmpeg for deterministic video transformation/rendering.
- External speech-to-text and LLM services behind server-side adapters.
- Payment gateway suitable for Indonesian QRIS/e-wallet/payment methods.
- Vercel for the web frontend; do not force long-running rendering into Vercel request execution.

AI providers should be accessed through adapters so the application is not permanently coupled to one vendor/model.

## 16. Data model

Initial tables:

### profiles
`id, email, name, avatar_url, plan, created_at`

### projects
`id, user_id, title, source_type, source_url, duration, mode, status, created_at`

### jobs
`id, project_id, status, progress, current_step, error_message, attempt_count, started_at, completed_at`

### transcripts
`id, project_id, language, text, structured_segments, created_at`

### segments
`id, project_id, start_time, end_time, text, topic, hook_score, content_score, emotion_score, mode_score, overall_score`

### clips
`id, project_id, start_time, end_time, score, category, title, hook, caption, cta, status, created_at`

### clip_assets
`id, clip_id, asset_type, storage_path, width, height, duration, created_at`

### credit_wallets
`user_id, balance, updated_at`

### credit_ledger
`id, user_id, type, amount, reference_id, description, created_at`

### payments
`id, user_id, provider, provider_reference, amount, currency, status, package_id, created_at`

### subscriptions
`id, user_id, provider, plan, status, current_period_start, current_period_end`

### usage_events
`id, user_id, project_id, event_name, metadata, created_at`

## 17. Credit rules

User-facing abstraction:

> **1 credit ≈ 1 minute of source video processed**

Exact commercial conversion can be tuned after infrastructure cost measurement.

Reservation flow:

```text
check balance
 → reserve
 → process
 → success: consume
 → failure: refund
```

The ledger is the audit source; do not rely only on a mutable balance field.

Payment webhooks, not browser redirects, are the source of truth for adding purchased credits.

## 18. Free and paid strategy

Initial commercial model:
- Free trial with limited processing/output and potentially watermark/quality limits.
- Low-cost one-time credit packages suitable for Indonesian users.
- Larger creator package.
- Pro/high-volume plan.
- Business/agency plan later.

Example price bands are exploratory only: roughly Rp19k–25k, Rp49k–59k, Rp99k–149k, with larger/business pricing later. Final prices must be based on actual cost per processed minute and conversion testing.

## 19. Storage and security

- Source videos and generated assets are private by default.
- Use signed/expiring URLs for delivery where appropriate.
- Enforce user/project ownership at API and database layers.
- Supabase RLS for user-owned records.
- Never expose service/secret keys to browser code.
- Payment, AI provider, worker, and webhook secrets remain server-side.
- Apply retention policies to original uploads to control storage costs.

## 20. Cost optimization

Do not repeatedly send full raw video to expensive multimodal models. Prefer:

```text
video
 → audio/transcript
 → text/semantic candidate discovery
 → targeted visual analysis of candidates
 → render selected clips
```

Reuse transcript/segment analysis when switching modes. Track AI, compute, rendering, and storage costs per project.

## 21. Analytics

Track the funnel:

`visitor → create → upload → job started → first result → preview → download → signup → purchase → repeat project`

Also track mode selection and mode-level revenue. The primary product health metric should include repeat content creation, not just downloads.

## 22. Admin operations

Admin dashboard should expose:
- users
- projects
- queued/processing/completed/failed jobs
- processing duration
- AI/rendering cost metrics
- credits
- payments/revenue
- mode distribution
- retry failed job
- refund credits
- operational logs

## 23. Growth strategy

Free outputs may carry a subtle product watermark and attribution to create organic discovery. Paid output removes the watermark. SEO landing pages can target Indonesian intent such as AI video clipper, TikTok content generator, podcast clips, live seller clips, affiliate content, UMKM content, Reels generator, and Shorts generator after the core product is stable.

## 24. Scope boundaries

Not required for initial release:
- full professional video editor
- native Android/iOS apps
- social publishing scheduler
- team management
- API marketplace
- B-roll generation
- advanced thumbnail generation
- complex templates marketplace
- TikTok downloading as a core dependency

These can be added after core retention and monetization are validated.

## 25. Success criteria

The first production milestone is successful when a new user can:
1. Open the site without an account.
2. Upload or provide a supported video URL.
3. Choose one of the five modes.
4. Start an asynchronous job.
5. See meaningful progress.
6. Receive AI-ranked candidate moments.
7. Generate short clips with Indonesian captions and 9:16 reframing.
8. Preview results.
9. Create/save an account when required.
10. Download or purchase additional processing through the credit system.
11. Recover safely from failed processing without losing paid credits.

## 26. Implementation sequencing

Implementation should proceed only after this approved design is converted into a detailed implementation plan. Suggested build sequence:
1. repository/app foundation and tests
2. database schema/RLS
3. authentication and anonymous-to-account flow
4. project/job API and queue contracts
5. media upload and storage
6. transcription/segment pipeline
7. mode scoring and candidate selection
8. clip rendering/caption/reframe worker
9. result UI and lightweight editor
10. credit ledger and payment webhook flow
11. analytics/admin
12. production verification and cost tests

## 27. Design decision summary

The product is an **AI Content Engine for Indonesia** with five modes sharing one processing core. The central differentiation is **goal-aware content selection**: the same source video can produce different best clips depending on whether the user wants affiliate conversion, product sales, live-selling highlights, podcast moments, or educational/personal-brand content.
