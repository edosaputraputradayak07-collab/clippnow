# Vidklipral 2.0 Specification

## Goal
Turn Vidklipral into an independent AI content factory that converts long-form video into high-retention, platform-ready clips without depending on Vizard, LumiClip, or KlipAuto as the core engine.

## Product Principles
- Native processing: ingestion, analysis, selection, reframing, subtitles, and rendering are owned by Vidklipral.
- Retention-first: optimize for scroll-stop, completion, payoff, and rewatch potential rather than arbitrary timestamps.
- Quality over quantity: generate many candidates internally, then publish only distinct high-quality clips.
- Explainable scoring: every candidate has inspectable signals and penalties.
- Safe and durable: jobs are idempotent, ownership-scoped, retryable, credit-safe, and resistant to unsafe URLs/paths.
- Learning loop: user selection and downstream performance signals can improve Pattern Memory without making the core pipeline dependent on an external provider.

## Architecture
Input sources (upload/YouTube) feed a durable ingestion job. The analysis layer extracts transcript, scenes, speakers, silence, visual and timing signals. Brain 2.0 generates and scores candidate windows, the Retention Engine adjusts boundaries, the Clip Factory deduplicates and ranks results, Smart Reframe chooses layout/crop, Subtitle Engine renders captions, and the native FFmpeg render queue produces final MP4 assets.

## Brain 2.0 Signals
Each candidate may score: hook, curiosity, emotion, story completeness, information value, surprise, humor, speaker energy, visual interest, pacing, rewatch potential, dead air, first-three-second retention potential, standalone context, ending payoff, caption density, topic relevance, and duplicate/overlap risk.

## Candidate Pipeline
1. Analyze complete source.
2. Generate broad candidate windows around semantic, scene, speaker, and energy boundaries.
3. Score candidates.
4. Improve boundaries for hook/context/payoff.
5. Remove weak candidates.
6. Deduplicate and penalize overlap.
7. Cluster by topic/story.
8. Select configurable output counts (10/20/30 initially; scalable later).

## Retention Engine
Prefer self-contained stories with a strong opening, enough context, escalation or useful information, and a clear payoff. Candidate starts may move forward to remove setup or backward when context is required.

## Smart Reframe
Support 9:16, 1:1, 16:9 and 3:4. Select strategies based on detected speakers/objects: face tracking, active-speaker focus, two-person split, podcast layout, presenter framing, gameplay/facecam composition, object tracking, and safe fallback framing.

## Subtitle Engine
Support clean, bold, karaoke/word-highlight and hook-overlay styles with safe-zone-aware placement, keyword emphasis, and multilingual transcript input.

## Render Engine
Use native FFmpeg and durable jobs. Support progress, retries, idempotency, storage ownership boundaries, H.264/AAC MP4 output, and source-aware resolution.

## Learning / Pattern Memory
Record non-sensitive product signals such as selected/rejected candidates, edit adjustments, exported formats, and optionally user-supplied performance metrics. Use them to tune ranking/configuration while preserving deterministic baseline behavior.

## Security / Reliability
Validate source URLs, restrict output paths, scope storage by user, enforce origin/rate limits, reserve and reconcile credits, prevent duplicate job execution, and avoid exposing service credentials to clients.

## Definition of Done
A representative YouTube video can be ingested natively, analyzed, converted into ranked distinct candidates, automatically reframed/captioned, rendered to MP4, stored under the authenticated owner, and surfaced in the dashboard with progress and errors. All core logic has automated tests, and production deployment is verified before the PR is merged.
