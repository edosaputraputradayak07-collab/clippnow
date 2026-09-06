# Vidklipral Brain 2.0 Design

## Goal
Upgrade the existing Vidklipral Brain from a weighted clip score into a deterministic, testable analysis layer that can identify self-contained stories, strong hooks, retention signals, and useful context without depending on Vizard, LumiClip, or another external clipping provider.

## Scope
This is the first Vidklipral 2.0 sub-project. It deliberately does not implement the editor, subtitle renderer, reframe engine, or batch render queue yet. Those consume the Brain contracts defined here.

## Current foundation
The repository already contains:
- `lib/vidklipral/brain/scoring.ts` with bounded weighted scoring and dead-air penalty.
- `lib/vidklipral/brain/context-analyzer.ts` with transcript normalization and scene/silence/speaker rates.
- `lib/vidklipral/brain/clip-selector.ts` with score filtering, ranking, and overlap avoidance.
- `lib/vidklipral/brain/pattern-memory.ts` with bounded positive/negative feedback weights.
- Native YouTube ingestion and native FFmpeg rendering are already present on the feature branch.

## Design

### 1. Signal model
Extend the Brain signal contract with explicit story and retention signals while keeping all numeric signals normalized to `0..1`:

- hook
- curiosity
- emotion
- storyCompleteness
- informationValue
- surprise
- humor
- speakerEnergy
- visualInterest
- pacing
- rewatchPotential
- standaloneContext
- payoff
- captionDensity
- topicRelevance
- deadAir
- duplicatePenalty

`deadAir`, `duplicatePenalty` are penalties; the remaining fields are positive evidence.

### 2. Story shape
Introduce a deterministic `RetentionShape` classification:

`hook -> context -> escalation -> payoff`

A candidate is not required to contain every phase, but a high-quality standalone candidate must have a strong opening and sufficient context, and should prefer a coherent ending/payoff. The classifier must be pure and testable from timestamped transcript segments plus optional event signals.

### 3. Candidate analysis contract
Add a pure analyzer that accepts timestamped transcript segments and optional scene/speaker/silence metadata and returns ranked candidate windows. The analyzer must:

- normalize invalid timestamps;
- reject zero/negative windows;
- keep candidate duration within configurable minimum/maximum bounds;
- prefer natural sentence/turn boundaries;
- calculate context and retention signals;
- calculate a final bounded score;
- expose score components for explainability;
- avoid mutating caller input.

### 4. Ranking and diversity
Ranking remains deterministic. Selection must avoid overlapping candidates and should add topic/semantic diversity hooks without requiring an external embedding provider in this phase. Duplicate suppression should initially use normalized transcript similarity and time overlap; embedding-based similarity can be a later optimization.

### 5. Pattern Memory integration
Pattern Memory remains a feedback layer, not the source of truth. Learned weights may adjust ranking but cannot push a candidate outside the `0..1` score range or bypass minimum quality gates. Existing bounded learning behavior must remain compatible.

### 6. Explainability
Every selected candidate must expose enough metadata for the UI/editor later:

- final score
- score breakdown
- retention shape
- reason labels such as `strong-hook`, `complete-story`, `high-curiosity`, `low-dead-air`, `high-rewatch`
- source start/end timestamps

### 7. Safety and reliability
All public helpers must handle malformed input without throwing unexpectedly except for programmer-contract violations. No shell commands, storage access, provider calls, or network access belong in the Brain package. This keeps the Brain deterministic and independently testable.

## Non-goals
- Do not add Vizard/LumiClip/KlipAuto as runtime dependencies.
- Do not add an external vector database.
- Do not implement subtitle rendering in this phase.
- Do not implement face tracking in this phase.
- Do not change the existing YouTube ingestion security model.
- Do not make deployment changes solely for this phase.

## Success criteria
1. Existing Brain tests remain green.
2. New tests cover story shape, natural boundaries, malformed timing, explainable scoring, diversity, and Pattern Memory compatibility.
3. The analyzer produces deterministic output for the same input.
4. The analyzer never mutates input arrays.
5. Final scores remain bounded and transparent.
6. The resulting contracts can be consumed by the future Clip Factory without re-parsing the video.

## Next sub-projects
After Brain 2.0 is verified, implement Clip Factory, then Search Inside Video, Smart Reframe, Subtitle/Hook Engine, Native Render Queue, Pattern Memory persistence, and finally the dashboard/editor integration.
