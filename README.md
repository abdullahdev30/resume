# Turborepo starter

This Turborepo starter is maintained by the Turborepo core team.

## Backend Auth Setup

The FastAPI backend uses Supabase Auth for account registration, email OTP
verification, login, session refresh, logout, password recovery, and password
changes. It does not create application user tables, write to `auth.users`, or
generate custom password hashes, JWTs, refresh tokens, or email tokens.

`POST /api/auth/login` sets the Supabase access and refresh tokens in
HttpOnly cookies. Tokens are not returned in JSON:

```json
{
  "message": "Login successful.",
  "user": {
    "id": "...",
    "email": "john@example.com",
    "name": "John Doe",
    "number": "03001234567",
    "email_verified": true
  }
}
```

For browser-authenticated requests, include credentials so cookies are sent.
Bearer tokens are still accepted by protected backend dependencies for tests
and non-browser callers where appropriate.

`POST /api/auth/refresh` reads the refresh token from the HttpOnly cookie,
rotates the Supabase session, replaces both cookies, and returns sanitized user
data:

```json
{
  "message": "Session refreshed successfully.",
  "user": {
    "id": "...",
    "email": "john@example.com"
  }
}
```

Required backend environment variables:

```sh
APP_NAME=Company API
APP_ENV=development
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
CORS_ORIGINS=
CORS_ORIGIN_REGEX=
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
DATABASE_URL=postgresql://...
COOKIE_SECURE=false
COOKIE_DOMAIN=
COOKIE_SAMESITE=lax
RATE_LIMIT_STORAGE_URI=memory://
CERTIFICATE_UPLOAD_DIR=uploads/certificates
```

For production, set `COOKIE_SECURE=true`, use an explicit allowed frontend
origin in `FRONTEND_URL` (plus any additional comma-separated origins in
`CORS_ORIGINS`), and replace `RATE_LIMIT_STORAGE_URI=memory://` with shared
storage that matches the deployment topology. Localhost, `127.0.0.1`, and IPv6
loopback origins are accepted on any port only when `APP_ENV` is a development,
local, or test environment.

Supabase Dashboard settings to configure manually:

- Authentication -> Providers -> Email: enable Email provider, new user signup,
  and Confirm Email.
- Authentication -> Email Templates -> Confirm Signup: include the OTP token so
  the frontend can ask the user to enter a code manually.
- Authentication -> Email Templates -> Recovery: include the OTP token if the
  password recovery UI uses manual OTP entry.
- Authentication -> URL Configuration: add the local and production frontend
  and backend URLs used by this project.

## Production deployment

This repository is a pnpm monorepo. Deploy the Next.js frontend to Vercel and
the FastAPI backend to Railway as separate services.

### Vercel frontend

In the Vercel project settings, configure:

- Root Directory: `apps/frontend`
- Framework Preset: `Next.js`
- Install Command: leave it at the detected/default pnpm command
- Build Command: leave it at the repository value (`pnpm build`)
- Output Directory: leave it at the Next.js default

Remove any old `npm install --prefix=../..` override. The app-level
`apps/frontend/vercel.json` pins the framework and build command, while Vercel
uses the root `pnpm-lock.yaml` and workspace metadata for installation.

Set this Vercel environment variable for Production, Preview, and Development
as appropriate:

```sh
NEXT_PUBLIC_API_URL=https://YOUR-RAILWAY-DOMAIN/api/v1
```

### Railway backend

Connect the same repository to a Railway service and keep its Root Directory
at the repository root. The root `railway.json` selects `Dockerfile.railway`,
so Railpack will not incorrectly treat the monorepo root as a Node service.
The container starts Uvicorn on Railway's injected `PORT` and Railway checks
`/health` before marking the deployment healthy.

At minimum, set these Railway variables (using real values):

```sh
APP_ENV=production
FRONTEND_URL=https://resume-seven-psi-88.vercel.app
BACKEND_URL=https://YOUR-RAILWAY-DOMAIN
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
DATABASE_URL=postgresql://...
CORS_ORIGINS=https://resume-2rp6qj2g0-abdullah-shafiques-projects-2f0cafbc.vercel.app
COOKIE_SECURE=true
COOKIE_SAMESITE=none
RATE_LIMIT_STORAGE_URI=memory://
```

Use a shared rate-limit store instead of `memory://` if the backend runs more
than one replica. `DATABASE_URL` is required at startup because the API applies
its PostgreSQL migrations during application startup.

Auth endpoints:

- `POST /api/auth/register`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/verify-recovery-otp`
- `POST /api/auth/change-password`

Profile endpoints require an authenticated session cookie or a valid bearer
access token.

Onboarding/profile endpoints:

- `GET /api/profile`
- `GET /api/profile/onboarding/status`
- `POST /api/profile/onboarding/personal`
- `POST /api/profile/onboarding/education`
- `POST /api/profile/onboarding/experience`
- `POST /api/profile/onboarding/skills`
- `POST /api/profile/onboarding/certificates`
- `PUT /api/profile/personal`

The personal step is required first and includes first name, last name, email,
phone, address, and optional social links. Education, experience, skills,
certificates, and projects can be skipped during onboarding and added later.

Profile item CRUD endpoints:

- `POST /api/profile/social-links`
- `PUT /api/profile/social-links/{item_id}`
- `DELETE /api/profile/social-links/{item_id}`
- `POST /api/profile/education`
- `PUT /api/profile/education/{item_id}`
- `DELETE /api/profile/education/{item_id}`
- `POST /api/profile/experience`
- `PUT /api/profile/experience/{item_id}`
- `DELETE /api/profile/experience/{item_id}`
- `POST /api/profile/skills`
- `PUT /api/profile/skills/{item_id}`
- `DELETE /api/profile/skills/{item_id}`
- `POST /api/profile/certificates`
- `POST /api/profile/certificates/upload`
- `PUT /api/profile/certificates/{item_id}`
- `DELETE /api/profile/certificates/{item_id}`
- `POST /api/profile/projects`
- `PUT /api/profile/projects/{item_id}`
- `DELETE /api/profile/projects/{item_id}`

Run backend checks from `apps/backend`:

```sh
venv\Scripts\python -m ruff check .
venv\Scripts\python -m pytest
venv\Scripts\python -m uvicorn main:app --reload --port 8000
```

### AI resumes and PDF download

AI generation runs only on the backend. Copy the `AI_*` values from
`apps/backend/.env.example` into the backend environment and set
`AI_API_KEY`; never add that key to `NEXT_PUBLIC_*` variables. Generated and
follow-up AI edits are validated against the same resume schema used by the
editor.

Editable resumes use the same six fixed-A4 React templates for preview and
browser printing. Download PDF saves pending editor changes, prepares fonts and
images, and opens the browser print dialog; choose Save as PDF with no margins
and background graphics enabled. Editable PDFs are not generated or stored by
the backend. Uploaded legacy PDFs remain private storage objects downloaded
through short-lived signed URLs.

## Using this example

Run the following command:

```sh
npx create-turbo@latest
```

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `docs`: a [Next.js](https://nextjs.org/) app
- `web`: another [Next.js](https://nextjs.org/) app
- `@repo/ui`: a stub React component library shared by both `web` and `docs` applications
- `@repo/eslint-config`: `eslint` configurations (includes `@next/eslint-plugin-next` and `eslint-config-prettier`)
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended):

```sh
cd my-turborepo
turbo build
```

Without global `turbo`, use your package manager:

```sh
cd my-turborepo
npx turbo build
pnpm exec turbo build
pnpm exec turbo build
```

You can build a specific package by using a [filter](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters):

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed:

```sh
turbo build --filter=docs
```

Without global `turbo`:

```sh
npx turbo build --filter=docs
pnpm exec turbo build --filter=docs
pnpm exec turbo build --filter=docs
```

### Develop

To develop all apps and packages, run the following command:

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended):

```sh
cd my-turborepo
turbo dev
```

Without global `turbo`, use your package manager:

```sh
cd my-turborepo
npx turbo dev
pnpm exec turbo dev
pnpm exec turbo dev
```

You can develop a specific package by using a [filter](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters):

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed:

```sh
turbo dev --filter=web
```

Without global `turbo`:

```sh
npx turbo dev --filter=web
pnpm exec turbo dev --filter=web
pnpm exec turbo dev --filter=web
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed (recommended):

```sh
cd my-turborepo
turbo login
```

Without global `turbo`, use your package manager:

```sh
cd my-turborepo
npx turbo login
pnpm exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

With [global `turbo`](https://turborepo.dev/docs/getting-started/installation#global-installation) installed:

```sh
turbo link
```

Without global `turbo`:

```sh
npx turbo link
pnpm exec turbo link
pnpm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.dev/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.dev/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.dev/docs/reference/configuration)
- [CLI Usage](https://turborepo.dev/docs/reference/command-line-reference)
