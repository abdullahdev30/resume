# Frontend

This is the single Next.js application. See the root [README](../../README.md) for setup and [working](../../working) for the complete data flow.

Run `pnpm dev` or `pnpm build` from the repository root. Account requests use the server-only `BACKEND_API_URL` through `/api/v1/*`; authentication cookies stay HttpOnly. The free editor sends no resume content to that API.

## Routes

| Route                       | Behavior                                                  |
| --------------------------- | --------------------------------------------------------- |
| `/`, `/about`               | Existing marketing pages                                  |
| `/templates`                | Public gallery, blank resume, tab-local Continue editing  |
| `/builder`                  | Alias to the public gallery                               |
| `/editor/{templateId}`      | Free editor, or account editor when `resumeId` is present |
| `/builder/editor`           | Alias to the current free draft                           |
| `/resumes/create/template`  | Template first, then persona/manual choice                |
| `/resumes/create/ai`        | Persona and instructions, then an unsaved AI proposal     |
| `/resumes`, `/resumes/{id}` | Account list and details                                  |
| `/resumes/{id}/edit`        | Shared account editor                                     |
| `/persona`, `/persona/{id}` | Owned persona library/editor                              |
| `/settings`, `/auth/*`      | Account profile/security and authentication               |

`modules/resume/components/ResumeEditor.tsx`, its form and toolbar are shared by free, template and AI flows. `editorDocument.ts` normalizes canonical ResumeData. `components/templates/ResumeDocument.tsx` and the ten templates render preview, print and server-source snapshots.

`store.ts` persists only the free draft to sessionStorage (`resume-maker-session`, version 2), debounced 500 ms. `AccountResumeEditor.tsx` handles source-version saves/autosave and server downloads. `templateHtml.ts`/`serializeResumeHtml.ts` capture resolved layout, embedded fonts and icons for WeasyPrint. PDF generation is not part of the initial frontend bundle.

Use `pnpm --filter frontend check-types`, `lint`, `test`, `test:auth`, `test:persona`, and `test:pdf` to verify. Build before browser tests. Account browser tests run the real proxy/service/rendering path with isolated authentication/database/storage fixtures; they do not prove delivery by external AI/email providers.
