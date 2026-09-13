# Vidklipral Job + Credit Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an atomic, retry-safe job queue and credit ledger for Vidklipral without importing or depending on any ClippNow source/configuration.

**Architecture:** Supabase PostgreSQL owns the authoritative job state, credit balances, reservations, and idempotency. Server-side RPCs perform atomic mutations; workers claim jobs with leases and `FOR UPDATE SKIP LOCKED`. YouTube is an input source only; the engine stores the URL/metadata and processes only media the application is permitted to process.

**Tech Stack:** Supabase PostgreSQL 17, SQL migrations, authenticated Supabase sessions, server-side worker/RPC boundary.

**Spec:** Approved Vidklipral V1 architecture and Creative Studio design from the current conversation.

## Global Constraints

- Vidklipral uses the dedicated Supabase project `fdxaqtmfpfpsrfynleej`.
- Do not copy, import, or depend on ClippNow files, source code, database, migrations, credentials, or configuration.
- Credit mutations must be atomic and idempotent.
- A failed/retried job must never double-charge credits.
- Owner accounts are unlimited inside Vidklipral and must be enforced server-side.
- Service-role credentials must never be exposed to the browser.
- RLS remains enabled on public application tables.
- YouTube processing must respect applicable access, copyright, and platform rules.

---

### Task 1: Lock database invariants

**Files:**
- Create: `supabase/migrations/20260914000100_vidklipral_job_credit_invariants.sql`
- Test: `supabase/tests/job_credit_invariants.sql`

**Interfaces:**
- Consumes: existing `jobs`, `credit_accounts`, `credit_transactions` tables.
- Produces: database constraints/indexes that prevent negative credit state and make idempotency deterministic.

- [ ] **Step 1: Write failing invariant checks**

```sql
select count(*) = 0 as no_negative_accounts
from public.credit_accounts
where balance < 0 or reserved < 0;

select count(*) = count(distinct user_id || ':' || idempotency_key) as unique_credit_idempotency
from public.credit_transactions
where idempotency_key is not null;
```

- [ ] **Step 2: Run the checks against the dedicated Vidklipral project and confirm the invariant is not yet enforced at the schema level.**

- [ ] **Step 3: Add CHECK constraints for `balance >= 0`, `reserved >= 0`, and `reserved <= balance + reserved` semantics through atomic function updates. Add a unique partial index on `(user_id, idempotency_key)` where the key is not null.**

- [ ] **Step 4: Re-run the invariant checks and verify they pass.**

- [ ] **Step 5: Commit the migration and test file.**

```bash
git add supabase/migrations/20260914000100_vidklipral_job_credit_invariants.sql supabase/tests/job_credit_invariants.sql
git commit -m "feat: enforce Vidklipral credit invariants"
```

### Task 2: Implement atomic credit reservation

**Files:**
- Create: `supabase/migrations/20260914000200_vidklipral_credit_rpc.sql`
- Test: `supabase/tests/credit_rpc.sql`

**Interfaces:**
- Produces: `public.reserve_credits(p_amount bigint, p_idempotency_key text, p_reference_id text, p_description text) returns jsonb`.
- Produces: `public.consume_reserved_credits(p_amount bigint, p_idempotency_key text, p_reference_id text, p_description text) returns jsonb`.
- Produces: `public.release_reserved_credits(p_amount bigint, p_idempotency_key text, p_reference_id text, p_description text) returns jsonb`.

- [ ] **Step 1: Write tests for first reservation, repeated idempotency key, insufficient balance, unlimited owner, consume, and release.**

```sql
-- Same authenticated user must get the same result on a repeated idempotency key.
-- A non-unlimited account must never have balance < 0.
-- An unlimited account must not have its numeric balance reduced by reservation.
```

- [ ] **Step 2: Verify the tests fail because the RPCs do not exist.**

- [ ] **Step 3: Implement SECURITY DEFINER RPCs that require `auth.uid()`, lock the user's credit row with `FOR UPDATE`, reject non-positive amounts, use the unique idempotency key, and update `reserved` atomically.**

- [ ] **Step 4: Implement consume/release so each operation is independently idempotent and cannot consume or release more than currently reserved. Record an auditable ledger row for every successful operation; unlimited-owner operations are logged with zero financial impact.**

- [ ] **Step 5: Grant execution only to `authenticated`; revoke from `public` and `anon`; set a fixed `search_path` inside SECURITY DEFINER functions.**

- [ ] **Step 6: Run all credit tests and verify PASS.**

- [ ] **Step 7: Commit.**

```bash
git add supabase/migrations/20260914000200_vidklipral_credit_rpc.sql supabase/tests/credit_rpc.sql
git commit -m "feat: add atomic Vidklipral credit RPCs"
```

### Task 3: Implement job creation and leasing

**Files:**
- Create: `supabase/migrations/20260914000300_vidklipral_job_rpc.sql`
- Test: `supabase/tests/job_rpc.sql`

**Interfaces:**
- Produces: `public.enqueue_job(p_project_id uuid, p_kind text, p_asset_kind public.media_asset_kind, p_idempotency_key text, p_input_path text, p_settings jsonb, p_credit_cost bigint) returns jsonb`.
- Produces: `public.claim_next_job(p_worker_id text, p_lease_seconds integer) returns public.jobs`.
- Produces: `public.renew_job_lease(p_job_id uuid, p_worker_id text, p_lease_seconds integer) returns boolean`.

- [ ] **Step 1: Write tests for idempotent enqueue, project ownership, queued status, FIFO claim, expired lease recovery, and concurrent claim exclusion.**

```sql
-- Two workers must never receive the same queued job in the same claim window.
-- Reusing the same user/idempotency key must return the original job.
```

- [ ] **Step 2: Run the tests and verify the RPCs fail because they do not exist.**

- [ ] **Step 3: Implement enqueue as one transaction: validate project ownership, reserve credits using the same transaction-safe semantics, create the job, and return the existing job when the idempotency key was already used.**

- [ ] **Step 4: Implement `claim_next_job` using `FOR UPDATE SKIP LOCKED`, reclaiming queued jobs and processing jobs whose lease expired, incrementing `attempts`, setting `worker_id`, and setting `lease_until`.**

- [ ] **Step 5: Implement lease renewal with worker ownership validation.**

- [ ] **Step 6: Run the job tests and verify PASS.**

- [ ] **Step 7: Commit.**

```bash
git add supabase/migrations/20260914000300_vidklipral_job_rpc.sql supabase/tests/job_rpc.sql
git commit -m "feat: add Vidklipral job enqueue and leasing"
```

### Task 4: Implement completion and failure accounting

**Files:**
- Create: `supabase/migrations/20260914000400_vidklipral_job_finalize.sql`
- Test: `supabase/tests/job_finalize.sql`

**Interfaces:**
- Produces: `public.complete_job(p_job_id uuid, p_worker_id text, p_output_path text, p_output jsonb) returns boolean`.
- Produces: `public.fail_job(p_job_id uuid, p_worker_id text, p_error_code text, p_error_message text, p_retryable boolean) returns boolean`.

- [ ] **Step 1: Write tests for successful completion, non-owner worker rejection, retryable failure, terminal failure, and credit release/consume behavior.**

- [ ] **Step 2: Verify the tests fail before the RPCs exist.**

- [ ] **Step 3: Implement completion to validate worker ownership and active lease, set `completed`, progress 100, output metadata, and consume the reserved credit exactly once.**

- [ ] **Step 4: Implement retryable failure to return the job to `queued` while retaining a bounded attempt count; terminal failure sets `failed` and releases the reservation exactly once.**

- [ ] **Step 5: Ensure stale workers cannot finalize a job after another worker reclaimed its expired lease.**

- [ ] **Step 6: Run tests and verify PASS.**

- [ ] **Step 7: Commit.**

```bash
git add supabase/migrations/20260914000400_vidklipral_job_finalize.sql supabase/tests/job_finalize.sql
git commit -m "feat: make Vidklipral job finalization credit-safe"
```

### Task 5: Verify YouTube input contract

**Files:**
- Create: `docs/architecture/youtube-input-contract.md`
- Test: `supabase/tests/youtube_project_contract.sql`

**Interfaces:**
- Produces: a documented contract for `projects.source_type='youtube'`, canonical URL storage, metadata storage, and processing authorization checks.

- [ ] **Step 1: Define accepted YouTube URL forms and reject obviously invalid/non-YouTube URLs at the application boundary.**

- [ ] **Step 2: Define the project metadata fields required before media processing starts: canonical URL, video ID, title when available, duration when available, channel/author when available, and permission/access status.**

- [ ] **Step 3: Add database checks only for stable invariants; keep URL parsing/provider-specific logic outside SQL.**

- [ ] **Step 4: Verify a YouTube project can be created without introducing any downloader dependency or ClippNow code.**

- [ ] **Step 5: Commit.**

```bash
git add docs/architecture/youtube-input-contract.md supabase/tests/youtube_project_contract.sql
git commit -m "docs: define Vidklipral YouTube input contract"
```

### Task 6: Security and regression verification

**Files:**
- Create: `supabase/tests/job_credit_security.sql`
- Modify: `docs/architecture/security-model.md`

**Interfaces:**
- Consumes: all RPCs from Tasks 2–4.
- Produces: verified RLS/RPC privilege boundary and a regression checklist.

- [ ] **Step 1: Test that anonymous callers cannot execute credit/job mutation RPCs.**

- [ ] **Step 2: Test that authenticated users cannot mutate another user's project/job/credit state through the RPCs.**

- [ ] **Step 3: Test that owner unlimited status is checked from server-side `profiles`/`credit_accounts`, not client metadata.**

- [ ] **Step 4: Test duplicate enqueue and duplicate finalize calls to prove idempotency.**

- [ ] **Step 5: Verify RLS remains enabled on all seven core tables plus `media_assets`.**

- [ ] **Step 6: Verify no service-role secret, old Supabase URL, ClippNow migration, or ClippNow runtime dependency is introduced.**

- [ ] **Step 7: Run the complete SQL test suite and record the result before moving to the AI generators.**

- [ ] **Step 8: Commit.**

```bash
git add supabase/tests/job_credit_security.sql docs/architecture/security-model.md
git commit -m "test: verify Vidklipral job credit security"
```
