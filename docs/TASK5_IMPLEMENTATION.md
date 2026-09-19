# VidClipMoney Task 5 — Project & Job API

Implemented project persistence boundary with authenticated actor checks, input validation, per-user idempotency, and owner-scoped retrieval. Heavy processing remains outside the request path and will be handled by the queue/worker stage.

## Acceptance
- POST /api/projects requires Supabase-authenticated user.
- Input requires one of the five content modes and upload/YouTube source fields.
- Idempotency is enforced by a partial unique index per user.
- Repeated idempotent requests reuse the existing project.
- GET /api/projects/[projectId] is scoped by authenticated user_id.
- No service-role credential is used in route code.
