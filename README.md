# Algo Fi Jib — Fonctions 2.0

Collaborative algorithm-learning platform for Tunisian secondary-school students. **New application, separate from Streamlit.**

## Current status: foundation / not production-ready

### Implemented in this first slice

- Next.js / TypeScript responsive public site: home, searchable library, 3ème/4ème pathways, seven algorithm lesson pages.
- Preserved educational **TDNT / TDOG, pseudocode and classroom Python** from the previous Fonctions codebase.
- Python FastAPI for read-only catalog and **bounded execution of the seven pre-reviewed functions only**. No execution of contributed source.
- Supabase Auth UI, protected role-aware contributor studio, Monaco editor, a **save draft** operation backed by a protected PostgreSQL RPC.
- SQL migration for roles, concepts, implementations, revisions, audit events, RLS and approval primitives.
- GitHub Actions checks for the Python API and TypeScript frontend.

### Deliberately *not* implemented / enabled yet

- Executing new code typed by contributors. **Never** send user Python to FastAPI `exec` or `eval`.
- Sandboxed draft testing, test-result attestation, submission/review UI, revision editing and rollback UI.
- Admin invitation management interface, production deployment, custom domain, rate limiting, privacy and abuse controls.
- Live public catalog from Supabase: current seven are read from a frozen snapshot while backend also serves them from pure Python modules.

These are mandatory before opening contributor submissions publicly. Approval RPC checks `test_status='passed'`, which **cannot be granted from the browser**.

## Run locally

Prerequisites: **Node.js 20.9+** (22 recommended), Python 3.11+.

**Terminal 1 — API** (from project root):

```bash
cd api
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# Linux/macOS: source .venv/bin/activate
python -m pip install -r requirements-dev.txt
python -m uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — website**:

```bash
cd web
npm install
cp .env.example .env.local  # On Windows, use: copy .env.example .env.local
npm run dev
```

Open **http://localhost:3000**. The public library requires no Supabase credentials. To run the built-in algorithms, start the API at **http://127.0.0.1:8000**.

## Classroom display: Tableau and Matrice

In the **Essayer** tab, results are rendered as accessible tables rather than raw JSON lists:

- **TABLEAU**: one row of values, with columns labelled by 0-based indices (`T[0]`, `T[1]`, etc.). The default choice **Tri (facultatif) → Aucun** displays the values in their original order. You can choose ascending or descending selection sort as a separate exercise.
- **MATRICE**: a two-dimensional grid with visible **Ligne 0, Ligne 1** and **Col. 0, Col. 1** headers. Its cell coordinates match `M[i, j]`. **No matrix sorting** has been added; it remains a future exercise for contributors.

The classroom code sections for declaration (TDNT/TDOG), manual/random filling and display remain available, and the tableau sorting code is retained as an explicitly optional section.

## Enable login and private drafts

1. Create a **new** Supabase project (do not use real students' production data for experiments).
2. Apply `supabase/migrations/001_initial_schema.sql` in Supabase SQL Editor.
3. In `web/.env.local`, fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from your project. They are public client settings, **not** a service-role secret.
4. Enable email/password login in Supabase Auth. New users receive `student` only.
5. After creating your own account, bootstrap the owner **manually** in Supabase SQL Editor:

```sql
-- Replace only with the ID of YOUR confirmed Auth user.
UPDATE public.profiles SET role='owner'
WHERE id = 'YOUR_AUTH_USER_UUID';
```

6. Invite a trusted friend to create a normal student account, then assign `contributor` using the owner-only `set_member_role` RPC (or Supabase SQL editor). A public user cannot assign themself a role.
7. After logging in, visit `/studio`. With contributor/reviewer/owner privileges, you can write Python in Monaco and **save a private draft**. It is not executed, tested, or published yet.

See [Architecture and roadmap](docs/ARCHITECTURE.md).

## Supported Python libraries

The planned isolated execution image includes the standard library `random` and installed `numpy`. The **built-in** reviewed engine uses the existing seven modules. The contributor editor accepts imports in saved drafts, but executing them remains disabled until an isolated sandbox with a fixed dependency allowlist, blocked network, CPU/memory/time/output limits, quotas, and no secrets is ready.

## GitHub development

The original Streamlit branch `streamlit-v1-modular` and original `main` stay available. This v2 branch is an independent application. Future platform changes should be made by feature branches and PR reviews.

## Milestone 2 — collaborator workspace (October 2026)

After completing the initial Supabase migration, run **`supabase/migrations/002_contributor_workspace.sql`** *once* in the Supabase SQL Editor. This is required even if your Google or email login already works.

- **Contributors:** list their own revisions, reopen a private draft, edit without creating duplicates, and read reviewer feedback. Saving is protected by the `update_draft` RPC; it checks ownership, permissions, draft status and an edit-sequence number so another browser tab cannot silently overwrite recent work. Every edit clears prior test evidence.
- **Owners:** use the team roles section in `/studio` to grant `contributor` or `reviewer`, or return someone to `student`. The person must already have a registered account; their User UID is visible under **Supabase → Authentication → Users**. Role assignments are audited. No one can grant `owner` through the app.
- **Reviewers:** see submitted revisions and may request changes with a written review note using the `request_revision_changes` RPC, but cannot review their own contributions.
- **Not yet enabled:** running or submitting new Python code, marking a test as passed, publishing a contribution, and inviting users by email through the app. The reviewer queue will stay empty until an isolated sandbox issues verifiable tests for submitted revisions.

**Quick verification:** Sign in as owner, create a draft, refresh `/studio`, reopen and edit it, then refresh and confirm the edit persists. Create a separate student account to verify `/studio` is denied, and use its Auth User UID in the owner team form to grant contributor rights. The new contributor should then see the editor after signing in. Do not share Supabase service-role/secret keys.

## Phase 3A — Python function contracts and example cases (October 2026)

After applying migrations **001** and **002**, run **`supabase/migrations/003_function_test_contract.sql` once** in the **Supabase SQL Editor**. It adds a nullable-by-default contract for older revisions, stores declared test cases, and exposes two new authenticated, audited RPCs (`create_draft_with_contract`, `update_draft_with_contract`). All existing published educational modules and drafts remain intact. Do **not** rerun migrations 001/002.

In `/studio`:

1. Declare an entry function, e.g. `pgcd`, choose parameters `a:int`, `b:int`, and return type `int`.
2. Add a test named `PGCD(24,18)`, with inputs JSON `{"a":24,"b":18}` and expected JSON `6`. Arrays use `[1,2,3]`, matrices use `[[1,2],[3,4]]`.
3. Press **Vérifier le format des tests** to check the contract and JSON type consistency **without running Python**. Only properly formatted cases can be saved, but none are certified as passed.
4. Save, refresh, reopen the draft. Its code, function signature, parameters and examples should all persist; editing increments `edit_seq` and invalidates any earlier test evidence.

**Security boundary:** This is *Phase 3A* (authoring + static validation). The platform still must not run contributed code until Phase 3B deploys a separate sandbox with networking disabled, secrets removed, pinned NumPy, time/memory/CPU/output quotas, server-verified test results tied to a code hash, and abuse tests. Merely supplying correctly formatted expected outputs does **not** mark a revision as passed or enable submission.

**After Phase 5:** build **Manage Account** (`/compte`) for account details, password change/reset (email/password accounts), OAuth account details, sign-out and privacy/account deletion controls. This is planned, not implemented yet.
