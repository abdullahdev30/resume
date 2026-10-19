# Resume Builder frontend

One Next.js application contains the free resume maker, classic template editors, and existing frontend routes. There is one `package.json`, TypeScript configuration, and production build. No separate Vite app is needed.

## Run

Use Node 24+ and the pnpm version declared in the repository root. From the root:

```sh
pnpm install
pnpm dev
pnpm build
pnpm test
```

The development server uses `http://localhost:3000`. Browser tests use the production build on port 3100, so build before testing. Install Chromium once with `pnpm --filter frontend exec playwright install chromium`. `pnpm --filter frontend start` serves the production application, and `pnpm --filter frontend check-types` checks all frontend source.

Root `dev:web`, `build:free`, `test:free`, and `build:legacy` are compatibility aliases for this same application. The optional backend still has its own `dev:backend` command; free resume routes do not need it.

## Routes and source

- `/`: original landing page with its original styling and typography.
- `/builder` and `/builder/editor`: retained free dashboard and TipTap editor, isolated from the original page flow.
- `/templates` and `/editor/[templateId]`: existing template gallery and document editor, including the compact outline, direct field editing, and local photo cropping.
- `/about`: an alias for the introductory page. `/editor` redirects to the original template gallery.
- Other existing routes remain under `app/`.

`features/resume-maker/` contains the migrated free editor's pages, components, templates, store, local font loaders, pagination, and export utilities. Its CSS is scoped to `.resume-maker-app` so it does not change the existing template editor. Next.js owns navigation and route entry points; there is no second React root or router.

Shared template rendering lives in `components/templates/`, and the structured template editor lives in `components/guest-editor/` and `modules/guest-resume/`. Existing backend adapters remain in `modules/` and `lib/`. Keep future account and premium features separate from browser-only resume state.

## Privacy and PDFs

The free document editor persists only in the current tab's sessionStorage, with schema validation, debounced writes, refresh flushing, and an in-memory fallback. Its resume content is never uploaded. Template editor drafts remain in component memory. The original UI uses Figtree and Bricolage Grotesque through Next.js font optimization; optional resume fonts are loaded on demand.

Download PDF opens the browser print dialog: choose **Save as PDF**, use 100% print scaling, turn off browser headers/footers, and enable background graphics for colored templates. Page dimensions and margins come from the editor; text remains selectable. Native print settings can override these defaults. Browser session restoration may restore sessionStorage; File → Clear data explicitly removes the free document.

The browser suite covers the full dashboard/editor flow, storage recovery, refresh persistence, long documents, rulers and formatting controls, and all seven page presets in both orientations. It also verifies direct template-field editing, full-width formatting controls, sidebar toggling, and local photo upload/cropping. Deeply nested lists may still use native print fragmentation, and other browsers require manual print verification.
