# Algo Fi Jib — free hosting beta

Deploy the website from the `algo-fi-jib-v2` branch, **not** the old Streamlit `main` branch. This setup provides a public beta for the seven built-in classroom algorithms. Paid/disposable contributor-code sandboxes are intentionally disabled.

## 1. Render — FastAPI (deploy first)

Create a new **Web Service** at https://dashboard.render.com/ connected to `Dali-mp4/Fonctions`:

| Setting | Value |
|---|---|
| Branch | `algo-fi-jib-v2` |
| Root directory | `api` |
| Language/runtime | Python 3 |
| Plan | Free, if offered in your region/account |
| Build command | `pip install -r requirements.txt` |
| Start command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

Leave `ENABLE_DRAFT_RUNNER=false` and `ENABLE_PUBLIC_METHOD_RUNNER=false`. Do not provide a Supabase service-role secret for a built-in-only beta. `WEB_APP_ORIGIN` may initially be blank; add the Vercel HTTPS origin in step 3. Test the deployment at `https://YOUR-API.onrender.com/health`. Free Render services can sleep and wake slowly.

## 2. Vercel — website

Import https://github.com/Dali-mp4/Fonctions at https://vercel.com/new. Select:

| Setting | Value |
|---|---|
| Framework | Next.js |
| Root directory | `web` |
| Production branch | `algo-fi-jib-v2` **not `main`** |
| `NEXT_PUBLIC_API_URL` | `https://YOUR-API.onrender.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Your existing Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public publishable key from Supabase → Project Settings → API Keys |

If initial Vercel import uses `main`, set **Project Settings → Environments → Production → Branch Tracking** to `algo-fi-jib-v2`, save, then redeploy from that branch. Any changes to `NEXT_PUBLIC_*` variables require rebuilding/redeploying because the browser bundles them at build time.

Use the resulting HTTPS Vercel URL as the public beta URL.

## 3. Connect the website to FastAPI

In Render's environment variables, set `WEB_APP_ORIGIN=https://YOUR-PROJECT.vercel.app` (exact HTTPS origin, no trailing slash). Redeploy the Render service. The API's CORS allowlist retains localhost for development and adds only the configured HTTPS origin.

On the Vercel website, check PGCD, TABLEAU, MATRICE and their **Essayer** execution tab. Browser developer tools should show API requests sent to Render, **not** localhost. If browser calls still target localhost, confirm `NEXT_PUBLIC_API_URL` in Vercel production settings and redeploy the website.

## 4. Supabase Auth redirects

In Supabase **Authentication → URL Configuration**:

- Set **Site URL** to the exact Vercel HTTPS origin.
- Add **Redirect URLs** `https://YOUR-PROJECT.vercel.app/auth/callback` for Google login and `https://YOUR-PROJECT.vercel.app/**` where broader same-origin email redirects are required.
- Keep `http://localhost:3000/**` for local development if needed.
- If Google OAuth was configured already, its provider redirect in Google Cloud normally remains the **Supabase** callback, not the Vercel callback. Review your Supabase Auth provider setup.

Configure production email delivery before enabling unrestricted email/password signups. Supabase's default mail service is heavily limited and may not send confirmation/reset emails to arbitrary recipients.

## 5. Launch gates and limitations

- Use a few trusted test accounts first; verify public pages, login, logout, mobile layout, account privacy, and permission boundaries.
- Confirm anonymous users can't read private revisions or roles. Review Supabase security advisors and backups before wider registration.
- On free Render, initial requests may wait for the sleeping service to restart. This is not a reliable production SLA.
- Paid/modal sandboxes for contributor-submitted Python stay off. Built-in algorithms still execute in FastAPI, but new contributor methods cannot be tested/published until an appropriately isolated, quota-controlled runner is funded and configured.
- Vercel Hobby permits personal non-commercial projects only. Reassess hosting when usage, monetization or operational needs change.

## Reference settings in code

- `web/.env.example` — frontend environment variables
- `api/.env.example` — API environment variables, including `WEB_APP_ORIGIN`
- `api/app/main.py` — CORS rules
- `api/requirements.txt` — production Python dependencies

Never commit `.env.local`, secret tokens, Supabase service-role keys, or OAuth client secrets to GitHub.
## 6. Opt-in: contributor draft Python testing via Modal

This is **not enabled by default**. Do not run contributor code directly inside the Render web service. The built-in algorithms run without Modal, but private revisions stay `not_run` and cannot be submitted or approved until their test cases pass in an isolated sandbox.

**Cost:** Modal Starter currently includes $30/month of compute credits, but **is pay-as-you-go** above the allowance and can incur charges. Check https://modal.com/pricing and set a Modal workspace spending limit/budget before enabling. Existing SQL reservation/quota functions also limit invocations but are **not** a substitute for a billing cap. No charge is incurred merely by leaving this feature disabled in the API.

1. Register at https://modal.com and create an API token (see https://modal.com/docs/cli/latest/token). Store the token ID and secret privately. Never paste them into GitHub, the frontend, or chat.
2. In Render → Web Service → Environment, set the following **private server environment variables**:

   ```dotenv
   SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
   SUPABASE_SERVICE_ROLE_KEY=YOUR_LEGACY_SERVICE_ROLE_JWT
   MODAL_TOKEN_ID=YOUR_MODAL_TOKEN_ID
   MODAL_TOKEN_SECRET=YOUR_MODAL_TOKEN_SECRET
   ENABLE_DRAFT_RUNNER=true
   ENABLE_PUBLIC_METHOD_RUNNER=false
   ```

   The **service role** is a privileged credential. This backend currently uses it as an `Authorization: Bearer` value to finish test reservations, so use the legacy `service_role` JWT from Supabase, **not** a newer `sb_secret_` key, unless the API is updated to support that credential type. Leave it on Render only. Do not replace existing `WEB_APP_ORIGIN`.
3. The API's `requirements.txt` includes `modal>=1.6,<2.0`. The existing Render build command (`pip install -r requirements.txt`) installs it on redeploy. Deploy the updated `algo-fi-jib-v2` branch and check Render logs for build success.
4. Verify that the needed Supabase SQL functions exist: `public.reserve_draft_test`, `public.finish_draft_test`, and `public.revision_has_verified_tests`. These come from the project's existing SQL migrations. Do not change test statuses or bypass SQL review gates manually.
5. Sign into https://algofijib.vercel.app/studio as an authorized contributor/owner and run the tests for one saved draft. The **first** sandbox creation may take longer because Modal must build the image. Check Render logs and the Modal dashboard if the runner returns an error.
6. Keep `ENABLE_PUBLIC_METHOD_RUNNER=false` until public contributed-code execution is separately assessed and budgeted. Once a draft passes, it can be submitted, but **a different reviewer** must approve it; the author cannot approve their own draft.

If sandbox testing must remain entirely cost-free without any risk of usage charges, leave the runner disabled for now and review the draft text/pseudocode manually until an alternative secure test runner and evidence path are implemented.
