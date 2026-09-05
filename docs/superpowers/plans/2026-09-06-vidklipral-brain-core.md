# Vidklipral Brain Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first-party Vidklipral Brain Core that analyzes, scores, ranks, and selects short-form clip candidates without requiring Vizard or LumiClip.

**Architecture:** Keep Brain Core as a pure TypeScript decision layer under `lib/vidklipral/brain`. It consumes normalized candidate data and returns explainable, deterministic decisions; later media workers will consume its output for FFmpeg rendering.

**Tech Stack:** TypeScript, Vitest, existing Next.js application.

**Spec:** `docs/superpowers/specs/2026-09-06-vidklipral-brain-core-design.md`

## Global Constraints

- Vidklipral Brain is the primary decision layer.
- Vizard and LumiClip are not required dependencies for Brain Core.
- Scores are normalized to 0..1 and explainable.
- The first learning phase records feedback; it does not silently mutate production weights.
- Brain Core must not bypass existing authentication, ownership, or media authorization.
- Heavy media processing remains outside Brain Core.

### Task 1: Context Analyzer Contract

**Files:**
- Create: `lib/vidklipral/brain/context.ts`
- Test: `lib/vidklipral/brain/context.test.ts`

**Interfaces:**
- Produces `analyzeClipContext(input)` with bounded context factors and human-readable reasons.

- [ ] **Step 1: Write failing tests** for complete/incomplete thoughts, missing-context penalty, strong opening, and dead-air penalty.
- [ ] **Step 2: Run the focused Vitest file and confirm failure.**
- [ ] **Step 3: Implement the smallest deterministic context analyzer.**
- [ ] **Step 4: Run the focused tests and confirm they pass.**
- [ ] **Step 5: Commit the task.**

### Task 2: Explainable Viral Scoring

**Files:**
- Modify: `lib/vidklipral/brain/scoring.ts`
- Modify: `lib/vidklipral/brain/scoring.test.ts`

**Interfaces:**
- Extend scoring to return a score breakdown and positive/negative reasons while preserving the existing bounded score API.

- [ ] **Step 1: Add failing tests for breakdown, deterministic output, and reason generation.**
- [ ] **Step 2: Run focused tests and confirm failure.**
- [ ] **Step 3: Implement explainable scoring without changing the existing signal semantics.**
- [ ] **Step 4: Run focused tests and the existing scoring suite.**
- [ ] **Step 5: Commit the task.**

### Task 3: Smart Candidate Selector

**Files:**
- Create: `lib/vidklipral/brain/selector.ts`
- Test: `lib/vidklipral/brain/selector.test.ts`

**Interfaces:**
- Produces `selectClipCandidates(candidates, options)` with ranking, overlap suppression, minimum score filtering, and requested count.

- [ ] **Step 1: Write failing tests for overlap suppression, stable ordering, minimum score, and count limits.**
- [ ] **Step 2: Run focused tests and confirm failure.**
- [ ] **Step 3: Implement deterministic selection.**
- [ ] **Step 4: Run focused tests and confirm they pass.**
- [ ] **Step 5: Commit the task.**

### Task 4: Pattern Memory and Feedback Contract

**Files:**
- Create: `lib/vidklipral/brain/feedback.ts`
- Test: `lib/vidklipral/brain/feedback.test.ts`

**Interfaces:**
- Produces `recordFeedback`/`aggregateFeedback` for selected, rejected, edited, exported, and performance outcomes without storing raw video content.

- [ ] **Step 1: Write failing tests for aggregation and account/project scoping fields.**
- [ ] **Step 2: Run focused tests and confirm failure.**
- [ ] **Step 3: Implement in-memory/domain-level aggregation contract only; persistence wiring comes later with authorization tests.**
- [ ] **Step 4: Run focused tests.**
- [ ] **Step 5: Commit the task.**

### Task 5: Brain Facade

**Files:**
- Create: `lib/vidklipral/brain/index.ts`
- Test: `lib/vidklipral/brain/index.test.ts`

**Interfaces:**
- Produces one stable `analyzeCandidates` entry point that composes context, scoring, selection, and explainability.

- [ ] **Step 1: Write failing integration-style unit tests using deterministic fixtures.**
- [ ] **Step 2: Run focused tests and confirm failure.**
- [ ] **Step 3: Implement the facade.**
- [ ] **Step 4: Run Brain Core tests.**
- [ ] **Step 5: Run the complete project test suite.**
- [ ] **Step 6: Run TypeScript/build verification.**
- [ ] **Step 7: Commit the completed Brain Core.**

### Task 6: Production Verification

**Files:**
- No source changes unless verification finds a defect.

- [ ] **Step 1: Inspect GitHub checks for the final commit.**
- [ ] **Step 2: Inspect the matching Vercel production deployment.**
- [ ] **Step 3: Confirm build logs contain no errors.**
- [ ] **Step 4: Confirm the production deployment corresponds to the final commit.**
- [ ] **Step 5: Report evidence, not assumptions.**
