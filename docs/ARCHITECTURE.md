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

### Phase 4 review and rollback

Migration 005 replaces legacy unversioned submission/approval RPCs with exact
`edit_seq` checks and a strict link from saved passing evidence to the
`draft_test_runs` trusted finalized reservation. Submissions become read-only;
reviewer feedback invalidates previous passing evidence. Another reviewer
must explicitly approve the immutable revision. A DB pointer selects published
content; owner may withdraw or restore only a prior independently reviewed,
still verified revision. The app exposes scoped audit history; direct writes
remain disallowed. The student catalog still uses the seven reviewed source
modules until Phase 5, and account settings after Phase 5 remain planned.

### Phase 5 — Public database catalog with preserved teaching provenance

Migration 006 imports the seven source-controlled Fonctions V1 JSON lessons
into `legacy_lessons` with provenance checksums. These teaching artifacts
aren't counterfeit `revisions` with invented authors or test attestations.
The `published_methods` view has `security_invoker=true` and joins the exact
active pointer, published status, passed sandbox status, independent reviewer
and review timestamp. Anonymous public frontend queries never use auth cookies
or administrative credentials; they read only these two exposed, read-only
resources under least-privilege grants and RLS.

Student learning routes display both school originals and approved community
contributions. The original seven algorithms retain their fixed interactive
FastAPI engine; arbitrary contributor Python is never run by the public API.
Withdrawal/rollback in Phase 4 switches the pointer and therefore immediately
removes a public contribution; detail pages resolve only active revisions.

### Phase 5 refinement — consistent pedagogy, protected execution

Migration 007 augments each immutable reviewed revision with an atomically saved `lesson_content` JSON object (principle, example, limits, code sections). Approved alternatives now render within the original topic, using the original lesson's three tabs. Existing published revisions are backfilled from previously stored fields and retain their publication status. Library still uses anonymous RLS and `security_invoker` view, avoiding private drafts. The original seven classroom executors are never replaced. Contributor-public `Essayer` displays stored educational examples only, without real-time execution; a separate secured sandbox service would be needed to accept arbitrary public values.

### Phase 5 extension: metered student execution + chapter moderation

Public contributed methods remain authored/tested/independently approved
revisions with a frozen publication pointer. Student-supplied JSON **inputs
only** are accepted through an opt-in JWT-authenticated FastAPI endpoint;
no source substitution, no raw eval, no untrusted execution on the API host.
The SQL RPC checks approved status and original test evidence, enforces
atomic global and per-user quotas before allocating fresh Modal sandboxes,
and blocks paid anonymous runs. Production launch requires billing ceilings
and abuse controls beyond these starter quotas.

Topics created by contributors start private and pending, visible only to
their author and reviewers. Creating the topic and the first draft is atomic.
Approval of an independently reviewed tested method promotes the chapter;
withdrawal hides its only public method without removing original records.
TABLEAU's original display method and selection-sort Base variant use distinct
trusted classroom UI and bounded execution inputs, never a forged approval.


### Account management / deletion governance — migration 009

Account page: SSR getUser; no privileged key ever reaches Next.js. Name edits
use an authenticated SECURITY DEFINER RPC with validation; roles cannot be
edited by users. Email/password are changed via Supabase Auth updateUser,
which may require confirmation or recent authentication. Supabase Auth session
scopes provide local/other/global revocation; existing JWTs expire at their
normal expiration timestamp.

Deletion requests are RLS-isolated to the requesting user and the owner.
They do not delete data automatically, do not log personal details into audit
JSON, and can be cancelled. The first-owner profile is explicitly excluded.
Owners must review contribution ownership, outstanding drafts, test quotas,
review attestations and audit trails before individually processing any final
deletion through an approved administrative procedure. Published content is
never removed as a side-effect of a profile request. Future automation needs
separate reviewed anonymization/retention policy and robust FK handling.
