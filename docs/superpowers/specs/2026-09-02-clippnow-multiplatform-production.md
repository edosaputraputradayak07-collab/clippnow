# ClippNow Multiplatform Production Design

Date: 2026-09-02
Status: Proposed — user review before implementation

## Goal

Turn ClippNow from a polished web prototype into a production product with one secure backend and three clients: Web, iOS/iPadOS, and Android. The product must support real video processing rather than simulated AI output, protect private user media, keep credit/payment accounting server-controlled, and be structured for App Store and Google Play submission.

## Product surface

### Web
- Landing page
- Email/password authentication
- Dashboard and project history
- Private video upload
- Clip editor: trim, aspect ratio, preview
- Render job creation and progress
- Rendered preview/download/share
- Credit balance and purchase flow

### iOS/iPadOS
- Native app experience, not a web wrapper
- Login/signup and persistent session
- Import video from Photos/Files
- Upload with progress and cancellation
- Project list and render status
- Preview, save/share to system destinations
- Deep links into projects/auth where useful
- Store-compliant privacy, permissions, account deletion and review access

### Android
- Native app experience
- Android photo/video picker and Files integration
- Upload progress/cancellation
- Project list, render status, preview, save/share
- Adaptive layouts for phones/tablets/foldables
- Target Android 16/API 36 for Google Play submission

## Core architecture

```text
Web / iOS / Android
        |
        v
Authentication/session
        |
        v
Secure API boundary
        |
        +---- Project/credit/payment DB functions
        |
        +---- Private Supabase Storage
        |
        v
Asynchronous video-processing worker
        |
        v
Rendered private output + job status
```

The browser/mobile clients never receive privileged Supabase or payment credentials. All authorization, credit reservation, payment finalization, and job state transitions are server-controlled.

## Video processing

Rendering is asynchronous. A project is created in `queued` state only after authorization and credit reservation succeed. A processing worker claims the job, validates the source object, runs deterministic FFmpeg rendering, writes the output to a private storage path, and updates project status. Failures move to `failed` with a safe user-facing error and an internal diagnostic identifier.

The first production rendering slice should support:
- trim by start/end seconds
- 9:16, 1:1 and 16:9 output
- normalized H.264/AAC MP4 output
- progress/status polling
- retry-safe job claiming
- output cleanup/expiry policy

AI highlight detection, transcription/subtitles and automatic reframing are separate processing stages so they can be added without weakening the core rendering path.

## Security model

- Supabase publishable key is client-safe; secret/service credentials remain server-side.
- RLS protects user-owned records.
- Private storage uses per-user paths and signed access only when needed.
- State-changing API routes enforce same-origin checks for browser requests and validate input server-side.
- Payment webhooks are signature-verified and idempotent.
- Credits are reserved/finalized through protected server-side database functions.
- File uploads enforce size/type/path constraints; worker-side validation must not trust browser metadata.
- Security headers and CSP remain enabled.
- Rate limiting should be applied to authentication, upload/job creation, payment endpoints and expensive processing operations.
- Logs must avoid video URLs, tokens, payment credentials and other sensitive data.

## Credit and payment invariants

1. A user cannot create a render job without sufficient credits.
2. A credit reservation is tied to exactly one project/job reference.
3. A retry cannot double-spend credits.
4. Payment credits are granted only after a verified provider callback and idempotency check.
5. Client-supplied price, credit amount, payment status or provider payload is never trusted as the source of truth.

## Mobile account model

All clients use the same Supabase user identity. The mobile clients should use secure platform session storage and never embed service-role credentials. Account deletion must remove/disable user-owned data according to the product retention policy and platform requirements.

## Store readiness

### Apple
As of April 28, 2026, App Store Connect uploads must use Xcode 26+ with the iOS/iPadOS 26 SDK or later. The production build plan therefore targets the stable Xcode 26 line rather than relying on a beta toolchain.

Before submission:
- App ID/bundle identifier
- signing and provisioning
- app icon and launch assets
- privacy manifest and App Store privacy answers
- age rating
- Terms/Privacy URLs
- account deletion flow
- screenshots and metadata
- TestFlight device testing
- review/demo account where login is required

### Google Play
As of August 31, 2026, new apps and updates submitted to Google Play must target Android 16/API 36 or higher. The Android build will therefore use target/compile SDK 36 and test Android 16 behavior, including adaptive/resizable layouts.

Before submission:
- package/application ID
- signed release build/AAB
- Play App Signing
- store listing and screenshots
- privacy policy and Data Safety answers
- account deletion flow
- content rating
- permissions review
- internal/closed testing
- production rollout checklist

## Delivery phases

### Phase 1 — Real rendering foundation
- Define job state model
- Add worker-safe job claim/finalize functions
- Implement FFmpeg worker
- Add status/progress API
- Store rendered output privately
- Add retry/cleanup handling
- Connect web editor to real rendering

### Phase 2 — Product intelligence
- Highlight detection pipeline
- Transcription
- Subtitle styles/burn-in
- Smart vertical reframing
- Multiple clip generation

### Phase 3 — Production hardening
- Rate limiting
- Observability
- error taxonomy
- retention/cleanup jobs
- backup/recovery checks
- security regression tests

### Phase 4 — Mobile clients
- Shared API contract
- iOS/iPadOS native client
- Android native client
- secure session handling
- media picker/import
- upload/render/preview/share

### Phase 5 — Store release
- TestFlight/internal Android testing
- production signing
- store assets and policy forms
- review fixes
- staged rollout

## Acceptance criteria

The product is not considered release-ready until all of these are true:
- A real uploaded video can be rendered into a playable MP4 without manual server intervention.
- A user can see queued/processing/completed/failed state transitions.
- Credits cannot be double-spent by retries or concurrent requests.
- Users cannot access another user's source or rendered media.
- Payment credit grants are idempotent.
- Web, iOS and Android use the same account/project/credit model.
- Mobile builds work on real devices, not only simulators/emulators.
- Store-required privacy, account deletion, review access and metadata are complete.
- Security and build checks pass before release.

## Non-goals for the first store release

- Full social-network publishing automation
- Unbounded video length/file size
- Fully automatic AI editing without user controls
- Desktop native apps

## Decision required

This document is the implementation contract for the next development stage. Review the architecture and scope before implementation begins; changes after implementation starts should be treated as deliberate scope changes.