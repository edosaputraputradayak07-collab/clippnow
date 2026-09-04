# Vidklipral Zero-Editing Content Factory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing clip pipeline into a low-friction content factory that automatically renders 5–10 short clips and gives each completed clip a platform-ready Viral Pack.

**Architecture:** Reuse the existing Supabase projects/jobs, private storage, Whisper transcription, viral-plan, FFmpeg renderer, signed-output URLs, and TikTok publishing integration. Add a pure Viral Pack generator plus a protected API endpoint and a results UI that fetches/generates copy from the saved transcript/edit plan. Do not add a second render system or a YouTube downloader.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Supabase, FFmpeg, existing Workflow jobs, OpenAI server-side API.

**Spec:** `docs/superpowers/specs/2026-09-05-vidklipral-zero-editing-content-factory-design.md`

## Global Constraints

- Maximum batch remains 10 clips.
- Initial project credit reservation remains unchanged; only additional child clips reserve additional credits.
- Owner plan remains unlimited.
- YouTube is preview/reference only; no automated download, scraping, or re-upload pipeline.
- Provider/API credentials remain server-side.
- Preserve authentication, ownership, same-origin, rate-limit, private-storage, signed-URL, credit-idempotency, and stale-worker protections.
- Viral score is a recommendation signal and must never be presented as a virality guarantee.
- Generated copy must be grounded in the actual transcript/edit plan.
- Tests, TypeScript, production build, security checks, and deployment must pass before completion.

---

### Task 1: Viral Pack domain contract

**Files:**
- Create: `lib/ai/viral-pack.ts`
- Create: `lib/ai/viral-pack.test.ts`

**Interfaces:**
- Consumes: transcript text, clip metadata, viral score, and target platform.
- Produces: `buildViralPack(input): ViralPack` where `ViralPack` contains `titles`, `caption`, `hashtags`, `keywords`, `cta`, and `angle`.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { buildViralPack } from './viral-pack';

describe('buildViralPack', () => {
  const input = {
    platform: 'tiktok' as const,
    title: 'Podcast clip',
    transcript: 'Ternyata cara sederhana ini bisa menghemat waktu setiap hari. Jangan lakukan kesalahan ini lagi.',
    score: 94,
  };

  it('creates grounded titles, caption, hashtags, keywords and CTA', () => {
    const pack = buildViralPack(input);
    expect(pack.titles).toHaveLength(3);
    expect(pack.caption.length).toBeGreaterThan(0);
    expect(pack.hashtags.length).toBeGreaterThanOrEqual(5);
    expect(pack.hashtags.length).toBeLessThanOrEqual(10);
    expect(pack.keywords.length).toBeGreaterThanOrEqual(3);
    expect(pack.keywords.length).toBeLessThanOrEqual(8);
    expect(pack.cta.length).toBeGreaterThan(0);
    expect(pack.angle.length).toBeGreaterThan(0);
    expect(pack.caption.toLowerCase()).not.toContain('pasti viral');
  });

  it('supports platform-specific output', () => {
    const youtube = buildViralPack({ ...input, platform: 'youtube-shorts' });
    const instagram = buildViralPack({ ...input, platform: 'instagram-reels' });
    expect(youtube.titles).toHaveLength(3);
    expect(instagram.titles).toHaveLength(3);
    expect(new Set(youtube.hashtags).size).toBe(youtube.hashtags.length);
  });

  it('does not invent claims when transcript is sparse', () => {
    const pack = buildViralPack({ platform: 'tiktok', title: 'Clip', transcript: 'Halo semuanya.', score: 50 });
    expect(pack.angle).toContain('Halo semuanya');
    expect(pack.hashtags.every(tag => tag.startsWith('#'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- --run lib/ai/viral-pack.test.ts`
Expected: FAIL because `lib/ai/viral-pack.ts` does not exist.

- [ ] **Step 3: Implement the minimal grounded generator**

Implement `ViralPack` and `buildViralPack`. Normalize whitespace, derive a short hook from the first meaningful transcript sentence, extract useful terms from transcript words, generate exactly three title candidates from the hook without adding factual claims, use platform-specific caption/CTA wording, deduplicate hashtags, cap hashtags at 10 and keywords at 8, and reject/strip phrases that promise virality such as `pasti viral`, `pasti FYP`, `dijamin viral`, or equivalent guarantees.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `npm test -- --run lib/ai/viral-pack.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ai/viral-pack.ts lib/ai/viral-pack.test.ts
git commit -m "feat: add grounded viral content packs"
```

---

### Task 2: Protected Viral Pack API

**Files:**
- Create: `app/api/projects/[id]/viral-pack/route.ts`
- Create: `app/api/projects/[id]/viral-pack/route.test.ts`

**Interfaces:**
- Consumes: authenticated `GET /api/projects/:id/viral-pack?platform=tiktok`.
- Produces: `{ pack: ViralPack }` after ownership validation; 401/403/404/429/422 errors for invalid requests.

- [ ] **Step 1: Write source-boundary tests**

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('Viral Pack API security boundary', () => {
  it('requires authentication, ownership, rate limiting and same-origin for web requests', () => {
    const source = readFileSync(path.join(process.cwd(), 'app/api/projects/[id]/viral-pack/route.ts'), 'utf8');
    expect(source).toContain("sameOrigin(request)");
    expect(source).toContain("securityGuard(`viral-pack:");
    expect(source).toContain("eq('user_id', user.id)");
  });

  it('does not call a client-side AI provider', () => {
    const source = readFileSync(path.join(process.cwd(), 'app/api/projects/[id]/viral-pack/route.ts'), 'utf8');
    expect(source).toContain("process.env.OPENAI_API_KEY");
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- --run app/api/projects/[id]/viral-pack/route.test.ts`
Expected: FAIL because the route does not exist.

- [ ] **Step 3: Implement the protected route**

Authenticate using the same web/mobile pattern as the existing AI route, enforce same-origin for non-bearer requests, apply `securityGuard` at 10 requests per 60 seconds per user/IP, load the project with `.eq('id', id).eq('user_id', user.id)`, require a completed project or return 409, read `edit_plan` and `viral_score`, derive transcript from the saved plan, validate platform against `tiktok`, `instagram-reels`, `youtube-shorts`, and `facebook-reels`, and call `buildViralPack`. Keep all provider credentials server-side. Return `noStoreHeaders()`.

The first implementation may use the deterministic grounded generator from Task 1 so the feature works without adding another paid model call. Keep the API contract ready for a later server-side LLM enhancement.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `npm test -- --run app/api/projects/[id]/viral-pack/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/api/projects/[id]/viral-pack/route.ts" "app/api/projects/[id]/viral-pack/route.test.ts"
git commit -m "feat: add protected viral pack API"
```

---

### Task 3: Automatic result experience and Viral Pack UI

**Files:**
- Modify: `app/dashboard/projects/[id]/render-project.tsx`
- Modify: `app/dashboard/projects/[id]/page.tsx` only if the existing server data contract must expose additional metadata.

**Interfaces:**
- Consumes: existing batch IDs, signed output URLs, project status, score, and `GET /api/projects/:id/viral-pack`.
- Produces: mobile-first result cards with preview, download, copyable Viral Pack, and existing authorized TikTok publish controls.

- [ ] **Step 1: Add UI behavior tests around copy/pack state**

Create a small pure helper test if needed in `lib/ai/viral-pack-ui.test.ts` rather than introducing browser automation dependencies. Verify a completed item renders a ready state and an incomplete item renders processing/error state.

- [ ] **Step 2: Run the focused UI/helper test and verify the initial behavior fails**

Run: `npm test -- --run lib/ai/viral-pack-ui.test.ts`
Expected: FAIL for the newly specified ready/processing behavior.

- [ ] **Step 3: Update the result screen**

For each completed batch item, fetch its Viral Pack once and show:
- Viral Score with label `Potensi performa`, never `jaminan viral`.
- Video preview.
- `Download MP4`.
- Three title candidates with one-tap copy.
- Caption with one-tap copy.
- Hashtags with one-tap copy.
- Keywords with one-tap copy.
- CTA and angle explanation.
- Existing `Post ke TikTok` integration remains available only after explicit user authorization/consent.

Add a batch-level `Download yang selesai` action using the existing signed URLs, without exposing private storage paths. Keep the interface usable on narrow mobile screens and prioritize completed clips above processing ones.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- --run lib/ai/viral-pack.test.ts lib/ai/viral-pack-ui.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/projects/[id]/render-project.tsx app/dashboard/projects/[id]/page.tsx lib/ai/viral-pack-ui.test.ts
git commit -m "feat: show ready-to-post viral packs"
```

---

### Task 4: Make the creation flow more automatic

**Files:**
- Modify: `app/dashboard/create/create-studio.tsx`
- Modify: `app/api/projects/[id]/ai/route.ts`
- Modify: `lib/ai/viral-edit-plan.ts`
- Test: `lib/ai/viral-edit-plans.test.ts`

**Interfaces:**
- Consumes: current mobile picker, batch count 5/8/10, transcript, goal, and edit-plan system.
- Produces: a single primary `Buatkan untuk saya` flow with Auto goal/style defaults and reliable non-overlapping clip plans.

- [ ] **Step 1: Extend viral-plan tests for short sources and batch choices**

Add tests verifying `count: 5`, `count: 8`, and `count: 10` never overlap when the source is long enough, and that a source shorter than the requested batch returns the maximum number of valid non-overlapping clips rather than overlapping clips.

- [ ] **Step 2: Run the viral-plan test and verify the new expectations**

Run: `npm test -- --run lib/ai/viral-edit-plans.test.ts`
Expected: PASS for existing cases; any new uncovered behavior should fail before implementation.

- [ ] **Step 3: Implement Auto defaults and clearer progress**

Keep `9:16`, TikTok, and Auto/Viral as defaults. Replace technical progress wording with user-facing stages such as `Membaca video`, `Mencari momen terbaik`, `Mengedit clip`, `Menyiapkan caption`, and `Menyiapkan video untuk posting`. Do not add a required manual editor step.

- [ ] **Step 4: Keep batch credit logic unchanged while improving failure messaging**

Preserve the existing initial reservation and additional reservation behavior in the AI route. Ensure the UI communicates that the first clip is already covered by the initial reservation and only additional clips consume additional credits for non-owner plans.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- --run lib/ai/viral-edit-plans.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/create/create-studio.tsx app/api/projects/[id]/ai/route.ts lib/ai/viral-edit-plan.ts lib/ai/viral-edit-plans.test.ts
git commit -m "feat: streamline zero-editing creation flow"
```

---

### Task 5: Full verification and production rollout

**Files:**
- Modify only files required by failures discovered in Tasks 1–4.

**Interfaces:**
- Consumes: complete feature branch on `main`.
- Produces: passing automated checks and a READY production deployment.

- [ ] **Step 1: Run the complete test suite**

Run: `npm test -- --run`
Expected: all tests pass.

- [ ] **Step 2: Run TypeScript verification**

Run: `npx tsc --noEmit`
Expected: exit code 0 with no TypeScript errors.

- [ ] **Step 3: Run the production web build**

Run: `npm run build`
Expected: successful Next.js production build.

- [ ] **Step 4: Verify security workflow**

GitHub Actions must report CodeQL and dependency-audit success for the final commit. Existing security constraints must remain present in the changed API/UI paths.

- [ ] **Step 5: Verify Vercel production deployment**

Confirm the deployment for the final commit is `READY`, build logs contain `Build Completed`, and production `https://clippnoww.vercel.app/` responds successfully. Check recent runtime errors and confirm there are no new fatal/runtime errors attributable to this rollout.

- [ ] **Step 6: Verify acceptance criteria**

Confirm from code/tests/deployment evidence that: mobile source selection works through the explicit native picker; 5/8/10 batch planning works; rendered MP4s use private storage and signed URLs; completed clips expose download and Viral Pack actions; Viral Pack contains titles/caption/hashtags/keywords/CTA/angle; no virality guarantee is used; YouTube remains preview-only; and authentication/ownership/rate-limit/credit/stale-worker protections remain intact.

- [ ] **Step 7: Commit any final verification-only fixes and report evidence**

```bash
git status --short
git log -5 --oneline
```

Do not claim completion until the checks above have actual passing evidence.
