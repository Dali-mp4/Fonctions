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