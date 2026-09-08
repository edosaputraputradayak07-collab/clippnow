# Vidklipral 2.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Vidklipral into an independent AI content factory with retention-first clipping, batch candidate selection, smart reframing, subtitles, durable native rendering, and a learning loop.

**Architecture:** Extend the existing Vidklipral Brain rather than replacing it. Keep ingestion and rendering provider-independent, add focused modules for candidate generation/retention/reframing/subtitles, and connect them through durable jobs with ownership and credit safety.

**Tech Stack:** Next.js/TypeScript, Supabase/Postgres/storage, Vercel Workflow, FFmpeg, existing transcription/AI integration, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-07-vidklipral-2.0.md`

## Global Constraints

- Core clipping must not depend on Vizard, LumiClip, KlipAuto, or another external clipping provider.
- Follow TDD: write a failing test, run it, implement the minimum, then rerun tests.
- Preserve ownership, origin, rate-limit, credit, path-safety, and idempotency protections.
- Do not merge or claim production readiness until deployment verification succeeds.
- Prefer focused modules with explicit interfaces over expanding monolithic dashboard components.

---

## Phase A — Brain 2.0 and Retention Engine

### Task A1 — Expand signal contract
- [ ] Add tests covering new Brain 2.0 signals and clamping/penalties.
- [ ] Run the focused scoring tests and confirm the new tests fail.
- [ ] Extend `lib/vidklipral/brain/scoring.ts` with first-three-second retention, standalone context, ending payoff, caption density, topic relevance, and overlap/duplicate penalties.
- [ ] Run scoring tests and the existing Brain suite.
- [ ] Commit the focused change.

### Task A2 — Candidate window generation
- [ ] Write tests for semantic/scene/speaker/energy boundary candidate generation.
- [ ] Confirm tests fail.
- [ ] Add `lib/vidklipral/brain/candidate-generator.ts` with deterministic candidate windows and duration limits.
- [ ] Run focused tests.
- [ ] Commit.

### Task A3 — Retention boundary optimization
- [ ] Write tests for moving candidate starts/ends around setup, context, escalation, and payoff.
- [ ] Confirm failure.
- [ ] Add `lib/vidklipral/brain/retention-engine.ts` with bounded timestamp adjustment and quality constraints.
- [ ] Run tests.
- [ ] Commit.

### Task A4 — Brain orchestration
- [ ] Write tests for analysis → candidates → retention → ranking output.
- [ ] Confirm failure.
- [ ] Add a focused orchestrator under `lib/vidklipral/brain/` that composes existing Context Analyzer, Pattern Memory, scoring, selector, and new modules.
- [ ] Run the Brain suite.
- [ ] Commit.

## Phase B — Clip Factory

### Task B1 — Deduplication and topic clustering
- [ ] Write tests for overlap suppression, near-duplicate suppression, and topic grouping.
- [ ] Confirm failure.
- [ ] Add `lib/vidklipral/brain/clip-factory.ts` with candidate dedupe, clustering, and configurable quotas.
- [ ] Run focused tests.
- [ ] Commit.

### Task B2 — Batch output contract
- [ ] Write tests for 10/20/30 output selection and stable ordering.
- [ ] Confirm failure.
- [ ] Extend project/job contracts to carry requested batch count through native YouTube ingestion and render preparation.
- [ ] Run API and workflow tests.
- [ ] Commit.

### Task B3 — Generate-more flow
- [ ] Write tests for requesting additional clips without duplicating prior outputs.
- [ ] Confirm failure.
- [ ] Add an authenticated API path that reserves/reconciles credits and excludes already selected candidate fingerprints.
- [ ] Run focused API tests.
- [ ] Commit.

## Phase C — Smart Reframe

### Task C1 — Reframe strategy contract
- [ ] Write tests for single speaker, two speakers, podcast, presenter, gameplay/facecam, object, and fallback strategies.
- [ ] Confirm failure.
- [ ] Add `lib/vidklipral/reframe/strategy.ts` with explicit aspect-ratio and tracking strategy selection.
- [ ] Run tests.
- [ ] Commit.

### Task C2 — Native FFmpeg reframe planner
- [ ] Write tests for safe crop bounds, aspect ratios, and fallback framing.
- [ ] Confirm failure.
- [ ] Extend `lib/vidklipral/engine/render-plan.ts` to consume reframe decisions without unsafe filter construction.
- [ ] Run render-plan tests.
- [ ] Commit.

## Phase D — Subtitle and Hook Engine

### Task D1 — Subtitle style contract
- [ ] Write tests for clean, bold, karaoke, keyword-highlight, and hook-overlay configurations.
- [ ] Confirm failure.
- [ ] Add a typed subtitle style model and validation module.
- [ ] Run tests.
- [ ] Commit.

### Task D2 — Safe-zone caption planner
- [ ] Write tests for caption placement across 9:16/1:1/16:9/3:4.
- [ ] Confirm failure.
- [ ] Add subtitle layout planning with line wrapping, keyword emphasis, and platform safe zones.
- [ ] Run tests.
- [ ] Commit.

## Phase E — Durable Native Render Queue

### Task E1 — Job lifecycle hardening
- [ ] Write tests for idempotent claim, retry, failure reconciliation, and duplicate completion.
- [ ] Confirm failure.
- [ ] Harden `workflows/vidklipral-render.ts` and supporting RPC usage.
- [ ] Run workflow-related tests.
- [ ] Commit.

### Task E2 — Resource-safe source handling
- [ ] Write tests for source-size/duration guardrails and temporary-file cleanup.
- [ ] Confirm failure.
- [ ] Refactor YouTube ingestion/render transfer paths to avoid unnecessary whole-file memory buffering where the runtime permits.
- [ ] Run tests and static checks.
- [ ] Commit.

### Task E3 — Native YouTube batch pipeline
- [ ] Write end-to-end contract tests for URL → project → ingestion → ready → batch render.
- [ ] Confirm failure.
- [ ] Connect the Clip Factory and render queue to native YouTube ingestion while preserving authentication, ownership, credits, and retries.
- [ ] Run the complete automated suite.
- [ ] Commit.

## Phase F — Pattern Memory / Learning

### Task F1 — Feedback event model
- [ ] Write tests for selected/rejected/edit/export events and candidate fingerprints.
- [ ] Confirm failure.
- [ ] Extend `lib/vidklipral/brain/pattern-memory.ts` with a bounded feedback model that does not require external clipping providers.
- [ ] Run tests.
- [ ] Commit.

### Task F2 — Ranking adaptation
- [ ] Write tests showing feedback can adjust ranking without breaking baseline scoring determinism.
- [ ] Confirm failure.
- [ ] Add conservative weighting/tuning hooks to the Brain.
- [ ] Run tests.
- [ ] Commit.

## Phase G — Dashboard

### Task G1 — Candidate review UI
- [ ] Write component/logic tests for candidate states and batch selection.
- [ ] Confirm failure.
- [ ] Extend dashboard project pages to show ranked candidates, scores, reasons, selected clips, and progress.
- [ ] Run tests/build checks.
- [ ] Commit.

### Task G2 — Reframe/subtitle controls
- [ ] Write tests for persisted aspect ratio and subtitle style preferences.
- [ ] Confirm failure.
- [ ] Add controls without bypassing server-side validation.
- [ ] Run tests.
- [ ] Commit.

### Task G3 — Library and analytics surface
- [ ] Write tests for rendered asset states and basic event aggregation.
- [ ] Confirm failure.
- [ ] Add library/analytics views based on existing project/job data and Pattern Memory events.
- [ ] Run tests/build checks.
- [ ] Commit.

## Phase H — Production Verification

### Task H1 — Full regression
- [ ] Run all GitHub tests.
- [ ] Run security checks.
- [ ] Verify no legacy provider is required by the native path.
- [ ] Verify ownership/credit/rate-limit/path-safety tests.

### Task H2 — Deployment verification
- [ ] Wait for Vercel build-rate capacity instead of creating repeated failed deployments.
- [ ] Deploy the current branch once capacity is available.
- [ ] Verify Preview READY on the current commit.
- [ ] Exercise authenticated YouTube ingestion with a permitted test source.
- [ ] Verify source-ready transition, Brain output, batch render, MP4 storage, and dashboard display.

### Task H3 — Release gate
- [ ] Convert PR to ready for review only after verification evidence exists.
- [ ] Request review and resolve actionable comments.
- [ ] Merge only after the production deployment is verified.
- [ ] Record release/version notes.
