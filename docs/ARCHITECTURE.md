# Architecture and security milestones

## Architecture

Browser (Next.js App Router + Supabase Auth cookies)
-> PUBLIC FastAPI: reviewed built-in algorithms only
-> PostgreSQL (Supabase): users + draft and review objects
-> FUTURE isolated runner: execute approved code in disposable sandboxes

Source of truth for the platform = GitHub. Source of truth for future contributed implementations = database revisions. Published code is pinned to a reviewed revision rather than mutable draft text.

## Roles

Visitor: read and test published content.
Student: visitor plus personal account, no write access to content.
Contributor: write private drafts, later submit after sandbox tests.
Reviewer: review contributions; cannot approve their own revision.
Owner: invite/change member roles (but not promote a second owner via the browser RPC).

The database, not client navigation, enforces roles. There is **no client-visible service-role key**. Direct table writes are denied and only scoped RPC calls create drafts.

## API boundary

`POST /api/v1/algorithms/{slug}/run` dispatches to one of seven trusted functions from the old modular project. It checks types, field names, and input lengths to bound work. It takes **values only** and rejects extra fields. Never extend it to evaluate source code supplied by users.

## Secure execution milestone (required before public contributor testing)

1. Decide on a managed sandbox provider and verify its isolation policies.
2. Build a separate runner with a pinned Python image containing `numpy` and standard library `random`. The image has *no* Supabase credentials or ability to reach production services.
3. Disable all outbound network access; cap CPU, RAM, wall-clock time, output bytes, tests per minute, and per-user budget.
4. Provide a single declared function entry point and JSON-serializable I/O contract. For NumPy arrays, define a safe conversion to JSON lists.
5. Validate results against declared and hidden test cases, record evidence against the exact SHA-256 hash of the submitted code and inputs. Only a trusted backend can set `test_status` to `passed`.
6. Implement an atomic submit/approve/reject/rollback flow and protect the runner endpoint with server-side auth, quotas and audit trails.
7. Add abuse testing, logging, privacy controls and production operational checks before inviting contributors.

**Important**: A simple subprocess or Python AST whitelist is NOT a security boundary for untrusted code.

## Database status

Migrations 001 + 002 provide accounts, private draft editing, role delegation and reviewer feedback. Migration 003 adds a versioned function contract and JSON example test cases, saved atomically with draft code. The editor validates JSON **format only**; it does not execute Python or record passing results. Sandboxed execution, test attestation, submission/publish buttons, rollback and public DB integration remain future work.

## Release plan

1. **Foundation:** polished Next.js frontend, FastAPI reviewed runner, baseline SQL and role-aware draft editor. (This slice.)
2. **Identity and authoring:** configure live Supabase, account invitation management and draft revision editing.
3. **Safe execution:** 3A authoring contracts and example cases (implemented); 3B isolated sandbox, resource/rate limits and trusted results (next).
4. **Review workflow:** submit, request changes, publish and restore revision; reviewer interface.
5. **Data migration:** move original seven to durable published records, preserve authorship and educational text.
6. **Account settings (after Phase 5):** account details, password change/reset for email-password users, connected OAuth identity information, logout/session controls, and account deletion/privacy options.
7. **Launch:** security assessment, backup strategy, mobile/browser QA, production monitoring.

### Phase 3B implementation (opt-in)

An authenticated FastAPI draft testing route runs saved, immutable-by-edit-sequence
revisions in Modal disposable sandboxes. The database owns per-user quotas and
test-state transitions; API service credentials never enter the sandbox.
The browser cannot provide replacement source or directly mark tests passed.
Modal must be enabled/configured separately, and the new SQL migration 004
applied to the user's project. Full production security testing and hidden
reviewer cases are still pending. Do not deploy contributor test endpoints
without strict CORS, secret storage, rate/budget monitoring and abuse checks.

### Phase 3C — latency telemetry and harness image

Trusted harness is baked into the pinned image; App/Image descriptors are
cached locally, but **sandbox instances and contributor code are never pooled**.
Resource isolation, blocked networking and quotas stay unchanged. The API
reports real monotonic timing breakdowns for diagnosis, not estimates or
performance guarantees; warm images require live measurement.


### Phase 4 — immutable submissions and moderated publication

Migration 005 replaces the legacy one-argument submit/approve RPCs with
optimistically locked actions and a **DB-verified association** between the
revision's passed evidence and a finalized \`draft_test_runs\` reservation.
Contributors can submit only their own, unchanged and passing draft.
Reviewers/owners cannot review their own submissions. Feedback invalidates
test status and remains in the audit log; author must test again.
Approval pins a revision to the corresponding \`implementations.published_revision_id\`
and locks submitted content. Owner-only withdraw/restore transactions operate
on published revision pointers and retain all audit records and source history;
restoration requires prior independent review and intact trusted evidence.
A scoped \`get_revision_history\` RPC avoids opening audit_events to all users.

The original classroom-facing seven remain in the frozen reviewed catalog
until Phase 5 consumes approved DB revisions. The Manage Account page remains
scheduled **after Phase 5** and before launch.
