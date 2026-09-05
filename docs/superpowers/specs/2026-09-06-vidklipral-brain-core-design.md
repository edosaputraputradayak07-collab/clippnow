# Vidklipral Brain Core Design

## Goal
Build a first-party decision engine that ranks video moments for short-form clipping without requiring Vizard or LumiClip.

## Principles
- Vidklipral Brain is the primary decision layer.
- Vizard and LumiClip are not required dependencies for Brain Core.
- The engine must be deterministic for the same normalized inputs so it is testable and debuggable.
- Scores are bounded and explainable; no opaque score is returned without its component signals.
- User feedback is stored as signals for later learning, but the first iteration does not silently rewrite production weights.
- Security decisions remain separate from content scoring.

## Pipeline
`source -> transcript/timestamps + media signals -> candidate windows -> context analysis -> scoring -> diversity/overlap selection -> editing plan`

## Brain Components

### 1. Signal model
Candidate signals are normalized to 0..1. Initial signals include hook, curiosity, emotion, story completeness, information value, surprise, humor, speaker energy, visual interest, pacing, rewatch potential, and dead air.

### 2. Context analyzer
Evaluates whether a candidate starts/ends on complete thoughts, depends on missing context, contains excessive dead air, or has a strong opening. It produces bounded context factors and reasons.

### 3. Viral scorer
Combines normalized signals using explicit weights and penalties. The score remains 0..1. The result includes a breakdown suitable for UI/debugging.

### 4. Candidate selector
Ranks candidates, removes excessive temporal overlap, applies minimum quality thresholds, and returns the requested number of diverse candidates without mutating source input.

### 5. Pattern memory
Stores aggregate, non-sensitive patterns such as successful signal combinations and clip-format outcomes. It must not store raw private video content in Brain Core.

### 6. Feedback loop
Records user actions such as selected, rejected, edited, exported, and later performance metrics when available. Feedback is used to create training/evaluation data first; automatic weight changes require a later controlled learning phase.

## Explainability Contract
Every selected candidate should be able to expose:
- final score
- signal breakdown
- penalties
- top positive reasons
- rejection reason when not selected

## Non-goals for this phase
- No dependency on external clipping providers.
- No autonomous model retraining in production.
- No claim that a score predicts platform virality with certainty.
- No direct publishing to social platforms.
- No heavy FFmpeg rendering inside Brain Core.

## Security Boundaries
- Brain receives already-authorized project/job data.
- Brain must never bypass ownership checks or signed media access.
- User-provided text is treated as data, never executable input.
- Learning data must be scoped to the owning account/project according to the application's existing authorization model.

## Testing
Unit tests cover normalization, scoring, context penalties, ranking, overlap/diversity selection, deterministic output, and feedback aggregation. Integration tests will later verify the Brain against the job pipeline using fixtures rather than external provider APIs.

## Success Criteria
1. A candidate list can be scored and ranked entirely by Vidklipral code.
2. Results are deterministic and explainable.
3. Candidate selection avoids returning near-duplicate overlapping clips.
4. Existing tests/build remain green.
5. Removing Vizard/LumiClip credentials does not prevent Brain Core from compiling or running.
