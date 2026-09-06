# Vidklipral Brain 2.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing Vidklipral Brain into a deterministic story-aware candidate analyzer while preserving the existing scoring, context, selector, and Pattern Memory contracts.

**Architecture:** Keep the Brain as a pure TypeScript domain package. Build a timestamped transcript/retention analyzer on top of the existing context and scoring primitives, then expose explainable candidate objects to the future Clip Factory. No network, storage, shell, or provider dependency is introduced.

**Tech Stack:** TypeScript 5, Vitest 3, existing Next.js repository, existing Vidklipral Brain modules.

**Spec:** `docs/superpowers/specs/2026-09-07-vidklipral-brain-2-design.md`

## Global Constraints

- All signal values are normalized to `0..1`.
- `deadAir` and `duplicatePenalty` are penalties.
- Brain modules remain pure and deterministic.
- Do not add Vizard, LumiClip, KlipAuto, or another external clipping provider.
- Do not add network, storage, shell, or database access to the Brain package.
- Existing tests must remain passing after every task.
- Use Vitest for every new behavior before implementation.

---

### Task 1: Define timestamped transcript and retention contracts

**Files:**
- Create: `lib/vidklipral/brain/retention.ts`
- Test: `lib/vidklipral/brain/retention.test.ts`

**Interfaces:**
- Produces `TranscriptSegment`, `RetentionShape`, `RetentionSignals`, and `classifyRetentionShape()` for later analyzer tasks.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { classifyRetentionShape, type TranscriptSegment } from './retention';

const segments: TranscriptSegment[] = [
  { startSeconds: 0, endSeconds: 3, text: 'Kamu tidak akan percaya apa yang terjadi.' },
  { startSeconds: 3, endSeconds: 8, text: 'Saya membuka bisnis ini dengan modal kecil.' },
  { startSeconds: 8, endSeconds: 15, text: 'Lalu dalam tiga bulan omzetnya naik sepuluh kali.' },
  { startSeconds: 15, endSeconds: 20, text: 'Itu yang akhirnya mengubah cara saya bekerja.' },
];

describe('classifyRetentionShape', () => {
  it('recognizes a hook, context, escalation and payoff sequence', () => {
    const result = classifyRetentionShape(segments);
    expect(result.hasHook).toBe(true);
    expect(result.hasContext).toBe(true);
    expect(result.hasEscalation).toBe(true);
    expect(result.hasPayoff).toBe(true);
  });

  it('returns a stable shape for malformed timing instead of throwing', () => {
    const result = classifyRetentionShape([
      { startSeconds: 4, endSeconds: 2, text: 'bad' },
      { startSeconds: Number.NaN, endSeconds: 3, text: 'also bad' },
    ]);
    expect(result.hasHook).toBe(false);
    expect(result.hasPayoff).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/vidklipral/brain/retention.test.ts`
Expected: FAIL because `retention.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

Implement `TranscriptSegment` with `startSeconds`, `endSeconds`, and `text`; normalize valid segments; derive the four boolean shape fields using deterministic text/timing heuristics; return false for unavailable phases.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/vidklipral/brain/retention.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/vidklipral/brain/retention.ts lib/vidklipral/brain/retention.test.ts
git commit -m "feat: add retention shape analysis"
```

### Task 2: Extend score signals without breaking existing callers

**Files:**
- Modify: `lib/vidklipral/brain/scoring.ts`
- Modify: `lib/vidklipral/brain/scoring.test.ts`

**Interfaces:**
- Consumes the existing `ClipSignals` callers.
- Produces an extended score breakdown type and preserves `scoreClipCandidate()` behavior for existing inputs.

- [ ] **Step 1: Write the failing tests**

```ts
it('includes standalone context and payoff in the score breakdown', () => {
  const result = scoreClipCandidate({
    hook: 1, curiosity: 1, emotion: 0.5, storyCompleteness: 1,
    informationValue: 0.7, surprise: 0.8, humor: 0.2, speakerEnergy: 0.8,
    visualInterest: 0.7, pacing: 0.8, rewatchPotential: 0.9, deadAir: 0,
    standaloneContext: 1, payoff: 1, captionDensity: 0.6, topicRelevance: 0.9, duplicatePenalty: 0,
  });

  expect(result.score).toBeGreaterThan(0.7);
  expect(result.breakdown.standaloneContext).toBe(1);
  expect(result.breakdown.payoff).toBe(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/vidklipral/brain/scoring.test.ts`
Expected: FAIL because the extended fields/result contract do not exist.

- [ ] **Step 3: Write minimal implementation**

Add optional extended fields with neutral defaults so old callers remain valid. Return a score object only through a new `scoreClipCandidateDetailed()` function; keep `scoreClipCandidate()` returning the existing number. Apply bounded penalties for dead air and duplicate penalty and bounded positive weights for context/payoff/topic relevance.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/vidklipral/brain/scoring.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/vidklipral/brain/scoring.ts lib/vidklipral/brain/scoring.test.ts
git commit -m "feat: extend Vidklipral scoring signals"
```

### Task 3: Add natural clip boundary selection

**Files:**
- Create: `lib/vidklipral/brain/boundaries.ts`
- Test: `lib/vidklipral/brain/boundaries.test.ts`

**Interfaces:**
- Consumes `TranscriptSegment[]`.
- Produces `ClipWindow { startSeconds, endSeconds }`.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { chooseNaturalBoundaries } from './boundaries';

describe('chooseNaturalBoundaries', () => {
  it('snaps requested bounds to nearby sentence or speaker boundaries', () => {
    const result = chooseNaturalBoundaries(
      [
        { startSeconds: 0, endSeconds: 5, text: 'Kalimat pertama.' },
        { startSeconds: 5.2, endSeconds: 11, text: 'Kalimat kedua.' },
        { startSeconds: 11.3, endSeconds: 17, text: 'Kalimat ketiga.' },
      ],
      5.1,
      16.8,
      1,
    );
    expect(result.startSeconds).toBe(5.2);
    expect(result.endSeconds).toBe(17);
  });

  it('returns null when no valid window can be produced', () => {
    expect(chooseNaturalBoundaries([], 0, 5, 1)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/vidklipral/brain/boundaries.test.ts`
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Write minimal implementation**

Validate finite segment ranges, choose the nearest valid segment start/end within the configurable snap distance, and reject windows whose final duration is non-positive.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/vidklipral/brain/boundaries.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/vidklipral/brain/boundaries.ts lib/vidklipral/brain/boundaries.test.ts
git commit -m "feat: add natural clip boundaries"
```

### Task 4: Build the explainable Brain candidate analyzer

**Files:**
- Create: `lib/vidklipral/brain/candidate-analyzer.ts`
- Test: `lib/vidklipral/brain/candidate-analyzer.test.ts`

**Interfaces:**
- Consumes `TranscriptSegment[]`, optional `ClipContextInput` metadata, and optional `PatternMemory`.
- Produces `AnalyzedClipCandidate[]` containing `id`, timestamps, transcript, retention shape, score, breakdown, and reason labels.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { analyzeClipCandidates } from './candidate-analyzer';

describe('analyzeClipCandidates', () => {
  it('returns deterministic, explainable candidates without mutating input', () => {
    const input = [
      { startSeconds: 0, endSeconds: 4, text: 'Ini rahasia yang jarang orang tahu.' },
      { startSeconds: 4, endSeconds: 10, text: 'Saya mencoba ini selama tiga bulan.' },
      { startSeconds: 10, endSeconds: 17, text: 'Hasilnya membuat omzet naik sepuluh kali.' },
      { startSeconds: 17, endSeconds: 22, text: 'Itulah alasan saya tidak kembali ke cara lama.' },
    ];
    const before = JSON.stringify(input);
    const first = analyzeClipCandidates(input, { minDurationSeconds: 8, maxDurationSeconds: 45 });
    const second = analyzeClipCandidates(input, { minDurationSeconds: 8, maxDurationSeconds: 45 });

    expect(first).toEqual(second);
    expect(JSON.stringify(input)).toBe(before);
    expect(first[0].score).toBeGreaterThanOrEqual(0);
    expect(first[0].score).toBeLessThanOrEqual(1);
    expect(first[0].reasonLabels.length).toBeGreaterThan(0);
  });

  it('rejects malformed and duplicate windows', () => {
    const result = analyzeClipCandidates([
      { startSeconds: 4, endSeconds: 2, text: 'bad' },
      { startSeconds: 0, endSeconds: 8, text: 'Useful hook and context.' },
      { startSeconds: 0.1, endSeconds: 8.1, text: 'Useful hook and context.' },
    ], { minDurationSeconds: 5, maxDurationSeconds: 30 });
    expect(result).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/vidklipral/brain/candidate-analyzer.test.ts`
Expected: FAIL because the analyzer module does not exist.

- [ ] **Step 3: Write minimal implementation**

Generate windows from transcript segment starts/ends, enforce duration bounds, classify retention shape, derive bounded signals, call the detailed scoring function, add deterministic reason labels, suppress normalized transcript duplicates, and sort by score descending without mutating input.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/vidklipral/brain/candidate-analyzer.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/vidklipral/brain/candidate-analyzer.ts lib/vidklipral/brain/candidate-analyzer.test.ts
git commit -m "feat: add explainable Vidklipral candidate analyzer"
```

### Task 5: Integrate Pattern Memory as a bounded ranking adjustment

**Files:**
- Modify: `lib/vidklipral/brain/candidate-analyzer.ts`
- Modify: `lib/vidklipral/brain/candidate-analyzer.test.ts`
- Modify: `lib/vidklipral/brain/pattern-memory.ts`
- Modify: `lib/vidklipral/brain/pattern-memory.test.ts`

**Interfaces:**
- Consumes existing `PatternMemory` and `learnFromFeedback()`.
- Produces candidate scores that remain within `0..1` and still respect hard quality gates.

- [ ] **Step 1: Write the failing test**

```ts
it('lets positive learned preferences break ties without bypassing quality gates', () => {
  const memory = createPatternMemory();
  const learned = learnFromFeedback(memory, { outcome: 'selected', signals: { hook: 1, pacing: 1 } });
  const result = analyzeClipCandidates(segments, { minDurationSeconds: 8, maxDurationSeconds: 45, patternMemory: learned });
  expect(result.every((candidate) => candidate.score >= 0 && candidate.score <= 1)).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/vidklipral/brain/candidate-analyzer.test.ts lib/vidklipral/brain/pattern-memory.test.ts`
Expected: FAIL because the analyzer does not accept Pattern Memory yet.

- [ ] **Step 3: Write minimal implementation**

Apply a small bounded adjustment derived from learned signal weights after base quality scoring. Clamp the result to `0..1`, keep the base breakdown intact, and never allow learned weights to bypass duration, malformed-input, or duplicate filters.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/vidklipral/brain/candidate-analyzer.test.ts lib/vidklipral/brain/pattern-memory.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/vidklipral/brain/candidate-analyzer.ts lib/vidklipral/brain/candidate-analyzer.test.ts lib/vidklipral/brain/pattern-memory.ts lib/vidklipral/brain/pattern-memory.test.ts
git commit -m "feat: integrate bounded pattern memory ranking"
```

### Task 6: Run the full Brain verification gate

**Files:**
- Modify: none unless a test exposes an integration defect.
- Test: all existing `lib/vidklipral/brain/*.test.ts` plus the new tests.

- [ ] **Step 1: Run the complete Brain test suite**

Run: `npm test -- lib/vidklipral/brain`
Expected: PASS for scoring, context analyzer, clip selector, pattern memory, retention, boundaries, and candidate analyzer tests.

- [ ] **Step 2: Run the TypeScript build/type check available through the repository scripts**

Run: `npm run build`
Expected: successful Next.js build/type validation. If the build is blocked by an external Vercel/deployment constraint, record that separately; do not alter deployment settings to force it.

- [ ] **Step 3: Review the diff against the Brain 2.0 spec**

Confirm every new public type/function is deterministic, no network/provider dependency was introduced, all scores are bounded, and existing API behavior remains compatible.

- [ ] **Step 4: Commit any verification-only correction**

```bash
git add lib/vidklipral/brain docs/superpowers
 git commit -m "test: verify Vidklipral Brain 2.0"
```

## Handoff

After Task 6 passes, stop before implementing Clip Factory. The next sub-project should consume the `AnalyzedClipCandidate` contract rather than reimplement Brain logic.
