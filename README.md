# Resume Maker

One Next.js/React/TypeScript frontend and one FastAPI backend support three resume workflows:

- **Free:** `/templates` -> `/editor/{templateId}`. One tab-only Zustand/sessionStorage draft; local browser print/PDF; no resume API calls or anonymous accounts.
- **Account template:** `/resumes/create/template`. Select a template, then copy a persona or enter information manually. Review in the shared editor and Save.
- **Account AI:** `/resumes/create/ai`. Select a persona and give instructions. Review the proposed content/design in the same editor before saving it.

The complete creation, storage, design, API, PDF and migration explanation is in [working](working).

## Run

Use Node 24+ and the pnpm version in `package.json`. From the root:

```sh
pnpm install
pnpm dev
pnpm build
```

The frontend runs at http://localhost:3000. Free editing does not require a backend. For account features, create a Python virtual environment at `apps/backend/venv`, install `apps/backend/requirements.txt`, copy `apps/backend/.env.example` to `.env`, configure the services, and run `pnpm dev:backend` in another terminal. `pnpm dev:all` starts both on Windows.

Set frontend server-only `BACKEND_API_URL=http://localhost:8000/api/v1`. Backend settings require Supabase Auth credentials, `DATABASE_URL`, private Supabase S3 credentials/bucket/endpoint, frontend/backend URLs, and `OPENAI_API_KEY`. AI defaults are `AI_PROVIDER=openai`, `AI_MODEL=gpt-5-mini`, `AI_BASE_URL=https://api.openai.com/v1`. Keep credentials in ignored environment files; never use a public frontend variable for a secret.

WeasyPrint needs native Pango libraries. The backend Dockerfile installs the Linux runtime. For local Windows development run `venv/Scripts/python scripts/install_pdf_runtime.py` from `apps/backend`; the worker discovers that local runtime. Backend startup runs ordered SQL migrations; review them and back up the database before deploying.

Supabase signup and recovery email templates must include `{{ .Token }}` for the six-digit OTP screens. Allow the frontend redirect URLs. Use `COOKIE_SECURE=true` for production HTTPS; local HTTP uses false, SameSite=lax and no cookie domain. Recovery challenges currently live in one backend process for ten minutes.

## Architecture

`apps/frontend/modules/resume/components/ResumeEditor.tsx` is the shared editor. The free and account wrappers supply different persistence/export behavior. `components/templates/` holds one canonical ResumeData shape, ten templates, pagination, preview and print rendering. Saved structured JSON plus sanitized styled HTML live in PostgreSQL; PDFs are replaceable derivatives in private object storage. Account authentication uses Supabase Auth and HttpOnly cookies. Personas are owned reusable sources; resumes are independent snapshots.

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
