# ClippNow Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the approved ClippNow design into a real, testable video-processing product that can later ship on Web, iOS/iPadOS, and Android.

**Architecture:** Keep clients thin and server-controlled. Supabase Auth/RLS and private Storage remain the data boundary; a server-only job API owns credit transitions; an asynchronous FFmpeg worker renders private outputs and updates job state. Mobile clients consume the same authenticated API contract instead of duplicating business logic.

**Tech Stack:** Next.js 16.3.4, React 19, TypeScript, Supabase SSR/JS, Supabase PostgreSQL/RLS/Storage, FFmpeg worker, GitHub Actions, Vercel for web/API deployment, native iOS and Android clients in later phases.

**Spec:** `docs/superpowers/specs/2026-09-02-clippnow-multiplatform-production.md`

## Global Constraints

- Browser/mobile clients never receive Supabase secret/service-role or payment server credentials.
- Source and rendered videos remain private and user-scoped.
- Every state-changing browser API enforces same-origin validation and server-side input validation.
- Credit reservation is server-controlled and idempotent per project/job reference.
- Payment credits are granted only after verified, idempotent provider callbacks.
- First rendering slice supports trim, 9:16/1:1/16:9, H.264/AAC MP4, progress/status, retry-safe claiming, and private output.
- Android production target is API 36 / Android 16 or higher.
- iOS/iPadOS production uploads target Xcode 26+ with iOS/iPadOS 26 SDK+.
- No task may claim completion without fresh verification evidence.

---

### Task 1: Establish test infrastructure and rendering domain contracts

**Files:**
- Create: `lib/rendering/types.ts`
- Create: `lib/rendering/validation.ts`
- Create: `tests/rendering/validation.test.ts`
- Modify: `package.json`

**Interfaces:**
- `RenderFormat = '9:16' | '1:1' | '16:9'`
- `RenderJobStatus = 'queued' | 'processing' | 'completed' | 'failed'`
- `validateRenderRequest(input): { ok: true; value: ... } | { ok: false; error: string }`
- Test runner command: `npm test`

- [ ] **Step 1: Add the smallest test dependency/config needed for TypeScript unit tests.**

- [ ] **Step 2: Write failing tests for valid formats, duration limits, finite timestamps, and rejection of malformed input.**

- [ ] **Step 3: Run `npm test -- --runInBand tests/rendering/validation.test.ts` and verify the new tests fail for the expected missing implementation.**

- [ ] **Step 4: Implement the validation/types module with no database or network dependency.**

- [ ] **Step 5: Run the same test command and verify all rendering validation tests pass.**

- [ ] **Step 6: Commit `test: establish rendering domain contracts`.**

### Task 2: Add durable render-job database state and atomic credit/job transitions

**Files:**
- Create: `supabase/migrations/<timestamp>_render_jobs.sql`
- Create: `lib/rendering/job-state.ts`
- Create: `tests/rendering/job-state.test.ts`
- Modify: `app/api/projects/route.ts`

**Interfaces:**
- Database table `render_jobs` keyed to `projects.id` with status, attempts, timestamps, worker lease, error code, output path, and progress.
- Protected functions for claiming a queued job and finalizing a job exactly once.
- `claimRenderJob(jobId, workerId): Promise<...>` server-only contract.
- `finalizeRenderJob(jobId, result): Promise<...>` server-only contract.

- [ ] **Step 1: Write failing tests for valid state transitions: queued→processing, processing→completed, processing→failed, and rejection of completed→processing.**

- [ ] **Step 2: Run `npm test -- --runInBand tests/rendering/job-state.test.ts` and verify failure.**

- [ ] **Step 3: Add the SQL schema with indexes and constraints for project ownership, unique job references, bounded progress, and lease timestamps.**

- [ ] **Step 4: Add protected server-side database functions with explicit execution restrictions and a fixed `search_path`.**

- [ ] **Step 5: Implement the TypeScript transition helpers and make `/api/projects` create exactly one render job after successful credit reservation.**

- [ ] **Step 6: Run unit tests plus the migration/static checks available in CI and verify the transition tests pass.**

- [ ] **Step 7: Commit `feat: add durable render job state`.**

### Task 3: Build the deterministic FFmpeg renderer

**Files:**
- Create: `lib/rendering/ffmpeg.ts`
- Create: `lib/rendering/renderer.ts`
- Create: `tests/rendering/renderer.test.ts`
- Modify: `package.json`

**Interfaces:**
- `buildFfmpegArgs(input): string[]` returns an argument array without shell interpolation.
- `renderClip(input, progress): Promise<{ outputPath: string }>`.
- Input contains source path, start/end seconds, and `RenderFormat`.

- [ ] **Step 1: Write failing tests asserting argument construction for all three aspect ratios and trim bounds, including protection against shell metacharacters in paths.**

- [ ] **Step 2: Run `npm test -- --runInBand tests/rendering/renderer.test.ts` and verify the tests fail before implementation.**

- [ ] **Step 3: Add a pinned FFmpeg runtime dependency suitable for the worker environment and implement process execution using `spawn`, never a shell command string.**

- [ ] **Step 4: Implement format-specific scaling/cropping with H.264 video and AAC audio in MP4 output, using deterministic output paths.**

- [ ] **Step 5: Add FFmpeg progress parsing and cancellation/error classification.**

- [ ] **Step 6: Run unit tests and a real sample-video integration test in the worker environment; verify the output is a playable MP4.**

- [ ] **Step 7: Commit `feat: add deterministic ffmpeg renderer`.**

### Task 4: Implement the isolated processing worker

**Files:**
- Create: `app/api/internal/render/claim/route.ts`
- Create: `app/api/internal/render/finalize/route.ts`
- Create: `worker/render-worker.ts`
- Create: `worker/storage.ts`
- Create: `tests/worker/render-worker.test.ts`

**Interfaces:**
- Worker authenticates with a dedicated server-only worker credential.
- Claim endpoint returns only the job payload authorized for that worker.
- Finalize endpoint accepts a signed/internal result and performs an atomic status transition.

- [ ] **Step 1: Write failing tests for unauthorized worker requests, duplicate claims, successful completion, failed completion, and retry after expired lease.**

- [ ] **Step 2: Run `npm test -- --runInBand tests/worker/render-worker.test.ts` and verify expected failures.**

- [ ] **Step 3: Implement worker authentication and request validation without exposing secrets to client bundles.**

- [ ] **Step 4: Implement private Supabase Storage download/upload using server-only credentials and verify the source object belongs to the project owner.**

- [ ] **Step 5: Connect the renderer, update progress, upload output, and finalize exactly once.**

- [ ] **Step 6: Add cleanup for temporary files and safe internal diagnostic identifiers.**

- [ ] **Step 7: Run worker tests and an end-to-end render against a controlled sample asset.**

- [ ] **Step 8: Commit `feat: add isolated video processing worker`.**

### Task 5: Connect dashboard editor to real jobs and result playback

**Files:**
- Modify: `app/dashboard/create/create-studio.tsx`
- Modify: `app/dashboard/page.tsx`
- Create: `app/api/projects/[id]/route.ts`
- Create: `app/api/projects/[id]/signed-output/route.ts`
- Create: `components/render-status.tsx`
- Create: `tests/api/projects-status.test.ts`

**Interfaces:**
- `GET /api/projects/:id` returns only the authenticated user's project/job state.
- `GET /api/projects/:id/signed-output` returns a short-lived signed URL only for completed, owned outputs.

- [ ] **Step 1: Write failing API tests for ownership, status serialization, and completed-output access.**

- [ ] **Step 2: Run the API test and verify failure.**

- [ ] **Step 3: Implement authenticated status/output endpoints with `Cache-Control: no-store`.**

- [ ] **Step 4: Replace simulated completion in the editor with polling/backoff and explicit queued/processing/completed/failed UI.**

- [ ] **Step 5: Add preview, save/download, share, retry, and safe error messaging.**

- [ ] **Step 6: Run tests and a deployed integration check against a real render job.**

- [ ] **Step 7: Commit `feat: connect dashboard to real rendering`.**

### Task 6: Add production limits, rate controls, retention, and observability

**Files:**
- Create: `lib/security/rate-limit.ts`
- Create: `app/api/internal/render/cleanup/route.ts`
- Create: `tests/security/render-rate-limit.test.ts`
- Modify: `.github/workflows/security.yml`
- Modify: `SECURITY.md`

- [ ] **Step 1: Write failing tests for rate limits on project creation/render operations and for rejecting expired/invalid cleanup requests.**

- [ ] **Step 2: Run security tests and verify expected failure.**

- [ ] **Step 3: Implement rate limiting using the deployment-compatible server-side mechanism without relying on client IP as authorization.**

- [ ] **Step 4: Implement retention cleanup for abandoned temporary files and expired rendered outputs while preserving active user projects.**

- [ ] **Step 5: Add structured safe logs with request/job IDs and no tokens, signed URLs, source paths, or payment credentials.**

- [ ] **Step 6: Add CI commands for typecheck, tests, and security audit.**

- [ ] **Step 7: Run the complete security test suite and commit `feat: harden rendering operations`.**

### Task 7: Production web verification and deployment gate

**Files:**
- Modify: `next.config.mjs` only if verification identifies a concrete issue.
- Modify: deployment/config docs as needed.

- [ ] **Step 1: Run `npm test`.**

- [ ] **Step 2: Run `npx tsc --noEmit`.**

- [ ] **Step 3: Run `npm run build`.**

- [ ] **Step 4: Deploy the feature branch to a preview environment and execute authenticated upload→render→preview verification with a controlled test video.**

- [ ] **Step 5: Inspect runtime logs for errors and verify no secret/provider payload leakage.**

- [ ] **Step 6: Compare the implementation against every acceptance criterion in the spec and record any remaining gap rather than claiming completion.**

- [ ] **Step 7: Commit `chore: verify production rendering release gate`.**

### Task 8: Shared mobile API contract and account/session hardening

**Files:**
- Create: `docs/mobile-api.md`
- Create: `app/api/mobile/session/route.ts` only if the existing auth endpoints do not expose a safe mobile contract.
- Create: contract tests under `tests/mobile/`.

- [ ] **Step 1: Write failing contract tests for login/session/project listing/render status/output authorization.**

- [ ] **Step 2: Implement only the minimum API additions required by iOS and Android; reuse existing authorization and credit logic.**

- [ ] **Step 3: Document token/session lifecycle and logout/account-deletion behavior.**

- [ ] **Step 4: Run contract tests and commit `feat: define mobile API contract`.**

### Task 9: iOS/iPadOS native client foundation

**Files:**
- Create: `mobile/ios/ClippNow/` native project sources and project configuration.
- Create: `mobile/ios/README.md`.
- Create: iOS unit/UI tests for authentication, picker, upload, status, and result flow.

- [ ] **Step 1: Write failing tests for the authenticated project state model and upload state transitions.**

- [ ] **Step 2: Implement the native Swift/SwiftUI client using secure platform session storage and the shared API contract.**

- [ ] **Step 3: Add Photos/Files import, upload cancellation, project status polling, preview, save/share, and account deletion.**

- [ ] **Step 4: Configure production bundle identifier/signing placeholders without committing certificates or secrets.**

- [ ] **Step 5: Build and test on a real iOS/iPadOS device using Xcode 26+ and iOS/iPadOS 26 SDK+.**

- [ ] **Step 6: Commit `feat: add native ios client foundation`.**

### Task 10: Android native client foundation

**Files:**
- Create: `mobile/android/` Gradle project.
- Create: `mobile/android/README.md`.
- Create: Android unit/instrumentation tests.

- [ ] **Step 1: Write failing tests for project state, upload cancellation, status polling, and output authorization.**

- [ ] **Step 2: Implement the native Android client with Jetpack Compose and secure session storage.**

- [ ] **Step 3: Add Android photo/video picker and Files integration, adaptive phone/tablet/foldable layouts, upload progress, status, preview, save/share, and account deletion.**

- [ ] **Step 4: Configure compileSdk/targetSdk 36 and release signing placeholders without committing secrets.**

- [ ] **Step 5: Build and test on Android 16 hardware/emulator and verify adaptive layouts.**

- [ ] **Step 6: Commit `feat: add native android client foundation`.**

### Task 11: Store-readiness package and release checklist

**Files:**
- Create: `docs/release/app-store.md`
- Create: `docs/release/google-play.md`
- Create: `docs/release/privacy-data-map.md`
- Create: `docs/release/review-account.md`

- [ ] **Step 1: Build a line-by-line Apple checklist covering bundle ID, signing, privacy manifest, privacy answers, age rating, account deletion, screenshots, TestFlight, and review access.**

- [ ] **Step 2: Build a line-by-line Google Play checklist covering package ID, AAB signing, Play App Signing, Data Safety, privacy policy, content rating, permissions, testing, and staged rollout.**

- [ ] **Step 3: Map every collected/stored/transmitted data category to its purpose, retention, and deletion path.**

- [ ] **Step 4: Verify store requirements against current official documentation immediately before submission and record source dates.**

- [ ] **Step 5: Commit `docs: add store release readiness checklist`.**

### Task 12: Final release verification and handoff

**Files:**
- No production-code changes unless verification exposes a concrete defect.

- [ ] **Step 1: Run the complete unit/contract/security test suite.**

- [ ] **Step 2: Run TypeScript and production builds for web and both mobile clients.**

- [ ] **Step 3: Execute real-device smoke tests for iOS and Android and the deployed web render flow.**

- [ ] **Step 4: Verify the complete acceptance checklist from the spec line by line.**

- [ ] **Step 5: If all checks pass, prepare a release PR; otherwise report exact blockers with evidence.**

- [ ] **Step 6: Commit only after verification and request final code review before merging/publishing.**
