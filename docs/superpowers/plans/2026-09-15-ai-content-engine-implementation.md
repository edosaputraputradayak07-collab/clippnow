# AI Content Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first production-capable AI Content Engine foundation, from anonymous creation through asynchronous project processing contracts, reusable AI analysis, clip outputs, credits, payments, and operational surfaces.

**Architecture:** Next.js owns the mobile-first product UI, server-side orchestration, authentication, project APIs, and dashboards. Supabase provides Postgres/Auth/Storage with RLS. Long-running media and AI work is represented by durable job contracts and worker adapters so rendering never depends on a Vercel request remaining open. The implementation is split into independently testable vertical slices: foundation, data/auth, project/media contracts, AI analysis, rendering/results, credits/payments, then analytics/admin and production verification.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Vitest 5, Supabase Postgres/Auth/Storage, queue/worker adapters, FFmpeg adapter, server-side STT/LLM adapters, Indonesian payment gateway adapter, Vercel web deployment.

**Spec:** docs/superpowers/specs/2026-09-15-ai-content-engine-design.md

## Global Constraints

- Mobile-first UX; responsive desktop support.
- Primary action is **Buat Konten**.
- Authentication is optional at the beginning; Google is preferred for low-friction signup.
- V1 inputs are direct video upload and supported YouTube URL; TikTok downloading is not a core dependency.
- Five modes: TikTok Affiliate, Seller / UMKM, Live Seller, Podcaster, Educator / Personal Brand.
- V1 outputs are 3–5 recommended vertical 9:16 clips with Indonesian captions, automatic reframing, preview, and download.
- Heavy processing is asynchronous; Next.js must not hold a request open for full video processing.
- Job states: QUEUED, DOWNLOADING, TRANSCRIBING, ANALYZING, SELECTING, GENERATING, RENDERING, COMPLETED, FAILED.
- Failed paid jobs refund reserved credits through the ledger.
- Ledger is the audit source of credit truth; mutable balance is not sufficient by itself.
- Payment webhooks are the source of truth for purchased credits.
- Source and generated assets are private by default; enforce ownership and RLS.
- Never expose service/secret keys to browser code.
- AI providers are accessed through server-side adapters.
- Do not claim AI scores guarantee virality.
- Reuse transcript/segment analysis when a user changes modes.
- Initial user-facing credit abstraction is approximately 1 credit per minute of source processing.
- Do not build a professional editor, native apps, scheduler, team management, API marketplace, B-roll generation, or TikTok downloading as core V1.

---

## Sub-plan A — Foundation and Product Shell

### Task 1: Establish testable application foundation

**Files:**
- Create: `src/lib/types/core.ts`
- Create: `src/lib/modes.ts`
- Create: `src/lib/jobs.ts`
- Create: `tests/lib/modes.test.ts`
- Create: `tests/lib/jobs.test.ts`
- Modify: `package.json`

**Interfaces:**
- `ContentMode = 'affiliate' | 'seller' | 'live_seller' | 'podcast' | 'educator'`
- `JobStatus = 'QUEUED' | 'DOWNLOADING' | 'TRANSCRIBING' | 'ANALYZING' | 'SELECTING' | 'GENERATING' | 'RENDERING' | 'COMPLETED' | 'FAILED'`
- `getModeConfig(mode): ModeConfig`
- `canTransitionJob(from, to): boolean`

- [ ] Write failing unit tests for all five modes and valid/invalid job transitions.
- [ ] Run `npm test -- --run tests/lib/modes.test.ts tests/lib/jobs.test.ts` and confirm failure from missing modules.
- [ ] Implement minimal immutable mode/job definitions.
- [ ] Run the focused tests and confirm they pass.
- [ ] Run the complete test suite and record the result.
- [ ] Commit with `feat: add content modes and job state contracts`.

### Task 2: Build the mobile-first landing/create shell

**Files:**
- Modify: `app/page.tsx`
- Create: `app/create/page.tsx`
- Create: `components/create/mode-picker.tsx`
- Create: `components/create/source-input.tsx`
- Create: `tests/components/create/mode-picker.test.tsx`

**Interfaces:**
- `ModePicker({ value, onChange })`
- `SourceInput({ onSubmit })`

- [ ] Write failing component tests for five modes, source selection, and primary CTA.
- [ ] Run focused tests and verify they fail before implementation.
- [ ] Implement accessible landing/create flow with clear Indonesian copy and mobile-first layout.
- [ ] Run focused tests.
- [ ] Run production build/typecheck.
- [ ] Commit `feat: add AI content creation shell`.

---

## Sub-plan B — Supabase Data, RLS, and Authentication

### Task 3: Create initial database schema and RLS policies

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`
- Create: `supabase/seed.sql`
- Create: `tests/db/schema-contract.test.ts`

**Interfaces:**
- Tables: `profiles`, `projects`, `jobs`, `transcripts`, `segments`, `clips`, `clip_assets`, `credit_wallets`, `credit_ledger`, `payments`, `subscriptions`, `usage_events`.
- Ownership must be enforced with RLS for user-owned records.

- [ ] Write schema contract tests for required tables, columns, enums/statuses, indexes, and ownership policies.
- [ ] Run schema contract tests and confirm they fail before migration exists.
- [ ] Implement migration with foreign keys, timestamps, indexes, constraints, and RLS.
- [ ] Add seed data only for deterministic development fixtures; never add secrets.
- [ ] Run schema tests and SQL validation available in CI.
- [ ] Commit `feat: add Supabase content engine schema`.

### Task 4: Implement anonymous-to-account authentication boundary

**Files:**
- Create: `lib/supabase/browser.ts`
- Create: `lib/supabase/server.ts`
- Create: `app/login/page.tsx`
- Create: `app/auth/callback/route.ts`
- Create: `tests/auth/auth-boundary.test.ts`

**Interfaces:**
- `getBrowserSupabaseClient()`
- `getServerSupabaseClient()`
- `exchangeAuthCode(request)`

- [ ] Write failing tests for unauthenticated create access and account-gated persistence/download behavior.
- [ ] Run tests and confirm failure.
- [ ] Implement server/browser Supabase clients without exposing service keys.
- [ ] Implement Google/email login boundary and callback.
- [ ] Run focused tests and build.
- [ ] Commit `feat: add Supabase authentication boundary`.

---

## Sub-plan C — Projects, Media, and Async Processing Contracts

### Task 5: Project/job API contracts and idempotency

**Files:**
- Create: `lib/projects/contracts.ts`
- Create: `lib/projects/service.ts`
- Create: `app/api/projects/route.ts`
- Create: `app/api/projects/[projectId]/route.ts`
- Create: `tests/projects/project-service.test.ts`

**Interfaces:**
- `createProject(input, actor): Promise<Project>`
- `getProject(projectId, actor): Promise<Project>`
- `createIdempotencyKey(input): string`

- [ ] Write failing tests for valid project creation, ownership rejection, and duplicate idempotency keys.
- [ ] Verify red tests.
- [ ] Implement service and API route using server-side auth/ownership checks.
- [ ] Verify focused tests and build.
- [ ] Commit `feat: add project API contracts`.

### Task 6: Media upload and private asset contracts

**Files:**
- Create: `lib/storage/media.ts`
- Create: `app/api/projects/[projectId]/upload/route.ts`
- Create: `app/api/projects/[projectId]/source-url/route.ts`
- Create: `tests/storage/media.test.ts`

**Interfaces:**
- `createUploadIntent(projectId, actor): Promise<UploadIntent>`
- `registerUploadedSource(projectId, asset): Promise<ProjectSource>`
- `validateSourceUrl(url): SupportedSourceUrl | ValidationError`

- [ ] Write failing tests for allowed file types, size/duration boundaries, private paths, ownership, and supported YouTube URL parsing.
- [ ] Verify red tests.
- [ ] Implement signed upload/storage contracts and source URL validation.
- [ ] Verify tests and build.
- [ ] Commit `feat: add private media upload contracts`.

### Task 7: Queue/worker contracts and durable job lifecycle

**Files:**
- Create: `lib/jobs/contracts.ts`
- Create: `lib/jobs/service.ts`
- Create: `lib/queue/client.ts`
- Create: `worker/process-project.ts`
- Create: `tests/jobs/lifecycle.test.ts`

**Interfaces:**
- `enqueueProjectJob(projectId, idempotencyKey): Promise<Job>`
- `claimJob(jobId, workerId): Promise<Job>`
- `updateJobProgress(jobId, status, progress, currentStep): Promise<void>`
- `failJob(jobId, error): Promise<void>`

- [ ] Write failing tests for legal transitions, bounded retry count, duplicate claim prevention, and terminal failure.
- [ ] Verify red tests.
- [ ] Implement persistence-first lifecycle and queue abstraction; keep queue provider replaceable.
- [ ] Verify focused tests.
- [ ] Commit `feat: add async job lifecycle contracts`.

---

## Sub-plan D — AI Analysis and Content Selection

### Task 8: Transcript and segment domain contracts

**Files:**
- Create: `lib/ai/transcription.ts`
- Create: `lib/ai/segmentation.ts`
- Create: `tests/ai/transcription.test.ts`
- Create: `tests/ai/segmentation.test.ts`

**Interfaces:**
- `TranscriptionProvider.transcribe(source): Promise<Transcript>`
- `segmentTranscript(transcript): Segment[]`

- [ ] Write failing tests using deterministic fixture transcripts with timestamps.
- [ ] Verify red tests.
- [ ] Implement provider interface and deterministic segmentation rules that preserve context.
- [ ] Verify tests.
- [ ] Commit `feat: add transcript and segment contracts`.

### Task 9: Mode-specific scoring and diversity selection

**Files:**
- Create: `lib/ai/scoring.ts`
- Create: `lib/ai/selection.ts`
- Create: `tests/ai/scoring.test.ts`
- Create: `tests/ai/selection.test.ts`

**Interfaces:**
- `scoreSegment(segment, mode): SegmentScore`
- `selectCandidates(segments, mode, limit): CandidateClip[]`

- [ ] Write failing tests showing each mode favors its intended signals and duplicate/near-duplicate candidates are suppressed.
- [ ] Verify red tests.
- [ ] Implement transparent weighted scoring and diversity selection.
- [ ] Verify tests across all five modes.
- [ ] Commit `feat: add goal-aware AI candidate selection`.

### Task 10: AI copy generation adapter

**Files:**
- Create: `lib/ai/llm.ts`
- Create: `lib/ai/content-pack.ts`
- Create: `tests/ai/content-pack.test.ts`

**Interfaces:**
- `LLMProvider.generateContentPack(input): Promise<ContentPack>`
- `buildContentPack(candidate, mode): ContentPackDraft`

- [ ] Write failing tests for hook/title/caption/CTA fields and mode-specific prompt constraints.
- [ ] Verify red tests.
- [ ] Implement provider-neutral server-side adapter and deterministic fallback for development/test.
- [ ] Verify tests; ensure provider secrets never enter client bundles.
- [ ] Commit `feat: add content pack AI adapter`.

---

## Sub-plan E — Rendering, Captions, Results, and Editor

### Task 11: FFmpeg rendering adapter and clip generation contract

**Files:**
- Create: `lib/render/ffmpeg.ts`
- Create: `lib/render/pipeline.ts`
- Create: `tests/render/pipeline.test.ts`

**Interfaces:**
- `RenderProvider.renderClip(input): Promise<RenderedAsset>`
- `buildRenderPlan(clip, options): RenderPlan`

- [ ] Write failing tests for 9:16 output, selected timestamps, captions, reframing, watermark rules, and idempotent asset naming.
- [ ] Verify red tests.
- [ ] Implement deterministic render-plan builder and FFmpeg adapter boundary; keep actual heavy execution in worker context.
- [ ] Verify tests and static typecheck.
- [ ] Commit `feat: add clip rendering contracts`.

### Task 12: Results/content pack UI

**Files:**
- Create: `app/project/[id]/page.tsx`
- Create: `app/project/[id]/clips/page.tsx`
- Create: `components/clips/clip-card.tsx`
- Create: `components/clips/content-pack.tsx`
- Create: `tests/components/clips/clip-card.test.tsx`

**Interfaces:**
- `ClipCard({ clip, onPreview, onEdit, onDownload })`
- `ContentPack({ clips })`

- [ ] Write failing tests for progress display, score display without virality guarantees, preview, edit, and gated download.
- [ ] Verify red tests.
- [ ] Implement mobile-first results UI.
- [ ] Verify tests and build.
- [ ] Commit `feat: add content pack results UI`.

### Task 13: Lightweight editor

**Files:**
- Create: `app/project/[id]/editor/[clipId]/page.tsx`
- Create: `components/editor/clip-editor.tsx`
- Create: `lib/render/editor.ts`
- Create: `tests/render/editor.test.ts`

**Interfaces:**
- `ClipEditor({ clip })`
- `buildEditorPatch(input): EditorPatch`

- [ ] Write failing tests for trim, caption style/position/font/size, crop/reframe, logo/watermark, headline, and CTA.
- [ ] Verify red tests.
- [ ] Implement only lightweight correction controls; do not create a full professional timeline editor.
- [ ] Verify tests/build.
- [ ] Commit `feat: add lightweight clip editor`.

---

## Sub-plan F — Credits, Payments, and Monetization

### Task 14: Credit wallet and immutable ledger

**Files:**
- Create: `lib/credits/ledger.ts`
- Create: `lib/credits/reservation.ts`
- Create: `app/credits/page.tsx`
- Create: `tests/credits/ledger.test.ts`
- Create: `tests/credits/reservation.test.ts`

**Interfaces:**
- `getBalance(userId): Promise<number>`
- `reserveCredits(userId, amount, referenceId): Promise<Reservation>`
- `consumeReservation(reservationId): Promise<void>`
- `refundReservation(reservationId, reason): Promise<void>`

- [ ] Write failing tests for atomic reserve, insufficient balance, consume, refund, double-consume prevention, and ledger audit trail.
- [ ] Verify red tests.
- [ ] Implement transaction-safe ledger operations.
- [ ] Verify tests.
- [ ] Commit `feat: add credit reservation ledger`.

### Task 15: Payment packages and webhook source of truth

**Files:**
- Create: `lib/payments/provider.ts`
- Create: `lib/payments/packages.ts`
- Create: `app/api/payments/webhook/route.ts`
- Create: `app/pricing/page.tsx`
- Create: `tests/payments/webhook.test.ts`

**Interfaces:**
- `PaymentProvider.createCheckout(input): Promise<Checkout>`
- `handlePaymentWebhook(request): Promise<WebhookResult>`
- `creditPackageCatalog(): CreditPackage[]`

- [ ] Write failing tests for signed/verified webhook handling, idempotent payment reference, successful crediting, and ignored duplicate events.
- [ ] Verify red tests.
- [ ] Implement provider-neutral payment boundary and Indonesian package catalog without hard-coding a vendor into domain logic.
- [ ] Verify tests/build.
- [ ] Commit `feat: add payment webhook and credit purchase flow`.

### Task 16: Enforce credit reservation in processing

**Files:**
- Modify: `lib/projects/service.ts`
- Modify: `lib/jobs/service.ts`
- Create: `tests/projects/credit-gating.test.ts`

**Interfaces:**
- `startProcessing(projectId, actor): Promise<Job>` must reserve credits before queueing paid work and release/refund them on terminal failure.

- [ ] Write failing tests for free allowance, insufficient credits, successful consumption, and failure refund.
- [ ] Verify red tests.
- [ ] Implement reservation integration with idempotent references.
- [ ] Verify tests.
- [ ] Commit `feat: enforce processing credit lifecycle`.

---

## Sub-plan G — Dashboard, Analytics, Admin, and Production Hardening

### Task 17: Dashboard, project history, and settings

**Files:**
- Create: `app/dashboard/page.tsx`
- Create: `app/settings/page.tsx`
- Create: `components/dashboard/project-list.tsx`
- Create: `tests/components/dashboard/project-list.test.tsx`

- [ ] Write failing tests for ownership-filtered projects, empty state, mode labels, and navigation.
- [ ] Verify red tests.
- [ ] Implement authenticated dashboard/settings surfaces.
- [ ] Verify tests/build.
- [ ] Commit `feat: add dashboard and settings`.

### Task 18: Funnel analytics and admin operational views

**Files:**
- Create: `lib/analytics/events.ts`
- Create: `app/admin/page.tsx`
- Create: `app/api/admin/jobs/[jobId]/retry/route.ts`
- Create: `app/api/admin/credits/refund/route.ts`
- Create: `tests/analytics/events.test.ts`
- Create: `tests/admin/authorization.test.ts`

**Interfaces:**
- `trackEvent(event): Promise<void>`
- Admin retry/refund endpoints require explicit admin authorization.

- [ ] Write failing tests for funnel event schema and admin authorization.
- [ ] Verify red tests.
- [ ] Implement analytics event tracking and minimal operational views/tools.
- [ ] Verify tests.
- [ ] Commit `feat: add analytics and admin operations`.

### Task 19: Security, reliability, and production verification

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Create: `tests/security/ownership.test.ts`
- Create: `tests/security/secrets.test.ts`
- Modify: `.github/workflows/*` as required

- [ ] Write failing regression tests for cross-user project access, private asset delivery, secret leakage, idempotency, and failed-job refund.
- [ ] Verify red tests.
- [ ] Implement final guards, environment documentation, retention configuration hooks, and CI checks.
- [ ] Run the full test suite and production build/typecheck through CI or available execution environment.
- [ ] Review all changed files against the approved design spec.
- [ ] Commit `chore: harden AI content engine for production verification`.

---

## Execution Notes

- Execute sub-plans in order; later tasks consume the exact interfaces defined earlier.
- Use TDD for every behavior: failing test → verify red → minimal implementation → verify green → broader verification → commit.
- Keep provider-specific code behind adapters; domain code must remain vendor-neutral.
- Prefer deterministic fixtures and fake providers in unit tests so CI does not require paid AI/rendering services.
- Real provider credentials, Supabase secrets, queue credentials, payment secrets, and service-role keys must be configured only in server/worker environments.
- No merge or deployment to the shared `main` branch is part of implementation without explicit user approval.
- Because the available GitHub integration can edit repository files but cannot provide a local shell/worktree session, GitHub branch isolation is used as the repository-level equivalent; verification must rely on available CI/workflow evidence rather than unrun local commands. Never report tests/builds as passing without fresh execution evidence.
