# Resume Maker

One Next.js/React/TypeScript frontend and one FastAPI backend support account-based resume workflows:

- **Packages:** Register and verify an account, then select a package at `/packages`. Package selection activates immediately without collecting payment. The public template gallery and free editor remain available without an account; account creation and editing require an active subscription.
- **Account template:** `/resumes/create/template`. Select a template, then copy a persona or enter information manually. Review in the shared editor and Save.
- **Account AI:** `/resumes/create/ai`. Select a persona and give instructions. Review the proposed content/design in the same editor before saving it.

The complete creation, storage, design, API, PDF and migration explanation is in [working](working).

## Administration and packages

Backend startup applies migration `015_subscriptions.sql`. It adds server-controlled account roles/status, package definitions, subscription snapshots, and a PostgreSQL trigger that enforces persona quotas under concurrent creation. Existing accounts and personas are retained; users without subscriptions must select a package before making changes. Expired users may still read or delete existing work. Deactivation blocks authenticated application API access, including existing sessions.

To create the first super admin, register and verify the intended operator account, then run from `apps/backend` with the configured database:

```sh
venv/Scripts/python scripts/bootstrap_super_admin.py --email operator@example.com
```

Open `/admin`. Super admins create, edit, and delete packages (name, description, persona limit, monthly price, currency), grant or remove admin roles, and activate/deactivate accounts. Admins list users with their personas and subscription status and manage ordinary users. Super admins cannot be disabled or demoted through the application; bootstrap and recovery are operator-only. No role is accepted from registration data or user-editable auth metadata.

Subscriptions expire after one calendar month using the database clock, with no automatic renewal. Users can renew expired subscriptions or switch packages immediately; a switch starts a new term. Selecting the same active package is rejected. Downgrading below the existing persona count is rejected. Package edits affect future subscriptions; existing subscriptions retain their purchased terms. Deletion archives a package, preserving current subscribers until expiration. No money is collected, payment details requested, or payment gateway configured. Prices are informational until a future payment integration; that integration must replace immediate activation with trusted payment confirmation.

The `modules/billing` modules on both apps contain this feature. All account and subscription reads bypass browser query caching, and backend dependencies enforce privileges and expiration independently of the interface. The landing page loads the public catalog from `/public/packages`. Its Create a resume action opens the template gallery at `/templates`, then the tab-only free editor for the selected template; Get started opens login. Public templates also open the free editor. Saved-account editor routes continue to require a subscription.

## Run

Use Node 24+ and the pnpm version in `package.json`. From the root:

```sh
pnpm install
pnpm dev
pnpm build
```

The frontend runs at http://localhost:3000. The free editor works without an account or backend. Account features require the backend and an active package. To configure account features, create a Python virtual environment at `apps/backend/venv`, install `apps/backend/requirements.txt`, copy `apps/backend/.env.example` to `.env`, configure the services, and run `pnpm dev:backend` in another terminal. `pnpm dev:all` starts both on Windows.

Set frontend server-only `BACKEND_API_URL=http://localhost:8000/api/v1`. Backend settings require Supabase Auth credentials, `DATABASE_URL`, private Supabase S3 credentials/bucket/endpoint, frontend/backend URLs, and `OPENAI_API_KEY`. AI defaults are `AI_PROVIDER=openai`, `AI_MODEL=gpt-5-mini`, `AI_BASE_URL=https://api.openai.com/v1`. Keep credentials in ignored environment files; never use a public frontend variable for a secret.

WeasyPrint needs native Pango libraries. The backend Dockerfile installs the Linux runtime. For local Windows development run `venv/Scripts/python scripts/install_pdf_runtime.py` from `apps/backend`; the worker discovers that local runtime. Backend startup runs ordered SQL migrations; review them and back up the database before deploying.

Supabase signup and recovery email templates must include `{{ .Token }}` for the six-digit OTP screens. Configure a working custom SMTP provider in Supabase Auth before accepting registrations: Supabase's default SMTP service is restricted to project team addresses and has a low sending limit. Allow the frontend redirect URLs. Use `COOKIE_SECURE=true` for production HTTPS; local HTTP uses false, SameSite=lax and no cookie domain. Recovery challenges currently live in one backend process for ten minutes.

## Architecture

`apps/frontend/modules/resume/components/ResumeEditor.tsx` is the shared editor. The account wrapper supplies server persistence and export behavior; the free wrapper provides tab-only persistence at `/editor/{templateId}` (`/builder/editor` redirects to the gallery). `components/templates/` holds one canonical ResumeData shape, ten templates, pagination, preview and print rendering. Saved structured JSON plus sanitized styled HTML live in PostgreSQL; PDFs are replaceable derivatives in private object storage. Account authentication uses Supabase Auth and HttpOnly cookies. Personas are owned reusable sources; resumes are independent snapshots.

`packages/eslint-config` and `packages/typescript-config` provide shared tooling. There is no second frontend, guest-account lifecycle, or duplicate rich-text builder.

## Check

```sh
pnpm check-types
pnpm lint
pnpm build
pnpm --filter frontend exec playwright install chromium
pnpm test
pnpm --filter frontend test:auth
pnpm --filter frontend test:persona
pnpm --filter frontend test:pdf
```

Browser integration suites use an isolated FastAPI fixture on 8011 and the production frontend on 3101; free tests use 3100. Do not rebuild `.next` while those servers are running. From `apps/backend`, run `venv/Scripts/python -m pytest -q` and `venv/Scripts/python -m ruff check app tests scripts/verify_resume_integrations.py`.

Optional `venv/Scripts/python scripts/verify_resume_integrations.py --only database|storage|ai` probes configured real services. Database probes roll back temporary data; storage probes delete their own verification object; AI probes send synthetic facts and incur provider usage. This is separate from deterministic integration tests.


Resume pages now use a fixed physical sheet with a 3 mm inset and automatic proportional fitting. The preview, free print root, thumbnails, and saved HTML use the same complete document; long content is scaled rather than duplicated onto a second template page. Margin controls are removed. Photo upload and crop/rotate/zoom adjustment are available from the editor Photo action on every template. The former File dropdown and persistent editor help strip are removed; Clear data and Delete resume remain direct actions. Login no longer links to a guest workspace.


Settings uses a side navigation for Profile, Package, and Security. The active panel is stored in the URL (`/settings?tab=package`), so refresh restores it without browser storage. TanStack Query shares in-memory API data across components and routes: ordinary reads stay fresh for five minutes, subscription/PDF reads for thirty seconds. Mutations invalidate related caches, persona changes invalidate subscription usage, and login/logout clear account caches. The profile is seeded from the server-verified user rather than fetching the same identity again. Settings/tab switches reuse cached data without full-page loading states; a first uncached request still needs a network response. Server authentication and role checks remain fresh per request; duplicate role queries within that request share one authorization snapshot, never a cross-user/global cache.
