# Project: Resume Maker Web App (Free Version, Frontend Only)

Build the FREE user experience of a resume builder web app. Login, payments and paid plans are a separate feature to be built later, so do NOT build them now, but keep the code modular so they can be added later.

## Tech stack
- React + TypeScript + Vite, React Router, Zustand for state.
- Rich text editing: TipTap (ProseMirror based) with a Google Docs-like toolbar.
- PDF export: fully client-side HTML to PDF (html2pdf.js or html2canvas + jsPDF; alternatively a print stylesheet with a dynamic @page size). Text in the PDF should remain selectable where possible.
- No backend, no database, no auth, no analytics trackers.

## Privacy / data rules (critical)
- Free users' resume data must NOT be sent or stored on any server, database or cookie. No backend, no analytics.
- Data persists ONLY in the browser's sessionStorage, so it survives a page refresh but is automatically erased when the tab or browser window is closed.
- Do NOT use localStorage, IndexedDB, cookies or any other persistent storage for resume content.
- Implementation: use Zustand's `persist` middleware with `createJSONStorage(() => sessionStorage)`. Persist the resume content, selected template, page setup, typography settings, margins, zoom and section order. Do not persist transient UI state (open menus, loading flags).
- Debounce writes to sessionStorage (about 500 ms) so typing never lags. Wrap reads/writes in try/catch and fall back to in-memory state if storage is unavailable or full (show a small non-blocking warning).
- Version the stored schema (a `version` field) and safely discard corrupted or outdated data instead of crashing.
- On refresh the user must return to exactly where they were (same route, same template, same content, same page setup). Show a skeleton while the state is being restored.
- Show a small, non-intrusive note in the editor: "Your data is kept only for this browser tab and is deleted when you close the tab. Download your resume to keep it."
- Do NOT add a `beforeunload` warning, since refresh is safe.
- Provide a "Clear data" action in the File menu that wipes the session data after a confirmation dialog.
- "Download PDF" is the only way to keep the result permanently.

## App flow
1. App opens directly on the Dashboard (no landing page, no login, no splash screen).
2. Dashboard shows the template gallery directly (see Dashboard design below). The user picks a template, or starts from a blank resume.
3. Clicking a template or "Use this template" opens the Editor with that template loaded. Optionally a "Preview" action opens a larger read-only preview modal first.
4. Editor: the user customizes the template, changes page size, fonts, spacing, and adds their own details.
5. Download: the user exports the resume as a PDF to their device using the chosen page size (filename like "FirstName-LastName-Resume.pdf").
6. A "Back to templates" action in the editor returns to the Dashboard. Switching template inside the editor keeps the user's content.

## Dashboard design (important, must look polished, not a bare button)
Keep the classic, simple, old-style look, but make the dashboard feel complete and professional.
- Top header: app name/logo on the left (plain text logo, serif or bold sans), a small "Privacy" info link on the right explaining how data is handled. No login/signup buttons.
- Page title area: heading "Create your resume", one short line of supporting text ("Choose a template to get started. You can customize everything in the editor."). Left aligned, generous spacing.
- "Continue editing" card at the top, shown only if the current tab already has a resume in sessionStorage: small thumbnail, title, template name, and a "Continue" button.
- Template gallery is the main content:
  - First card: "Blank resume" (a white page with a thin dashed border and a "+" icon) to start from scratch.
  - Then a responsive grid of 6 to 8 classic templates (4 columns desktop, 3 tablet, 2 small), each as a card with a realistic A4 thumbnail (portrait ratio), template name, and a short tag line (e.g. "Single column, ATS friendly").
  - On hover/focus a card shows two buttons over or under the thumbnail: "Use this template" (primary) and "Preview" (secondary). Whole card is also clickable and keyboard accessible.
  - Simple filter tabs above the grid: All, Single column, Two column, Compact. Optional "Page size" dropdown on the dashboard (A4 default, Letter, etc.) that is applied when a template is chosen.
- Use a flat design: white cards, 1px light gray borders, 2-4px radius, very subtle shadow only on hover. Light gray page background. No gradients, no glassmorphism, no heavy shadows, no emojis, no decorative illustrations.
- Show skeleton cards while thumbnails load. Thumbnails are lightweight (inline SVG, CSS-rendered mini resumes, or small optimized images with lazy loading and fixed dimensions to avoid layout shift).
- Footer: small gray text: "Your data stays in your browser tab and is never uploaded."

## Design direction (whole app)
- Simple, classic, old-style, professional look. NO modern, trendy or funky styling: no gradients, no glassmorphism, no heavy shadows, no animations beyond subtle transitions (150ms), no emojis in the UI.
- Neutral palette: white, light gray, black/dark gray text, one muted accent color (e.g. dark blue). Flat design, thin 1px borders, small border radius (2-4px).
- System UI font for the app interface (Arial/Segoe UI style).
- Templates must be classic and ATS-friendly: single or simple two-column layouts, serif or plain sans fonts (Times New Roman, Georgia, Arial, Calibri-like), clear section headings with thin rules, no icons, no graphics, no skill bars, no photos by default.
- Clean, neat, consistent UI with generous spacing and clear hierarchy. Desktop first; usable on tablet; on mobile show a simple message or reduced editor.

## Editor requirements (UI and behavior should closely match Google Docs)
Layout:
- Top bar: back button, resume title (editable inline, like a doc title), Download PDF button on the right.
- Menu bar under it (File, Edit, View, Insert, Format) with working dropdowns:
  - File: Page setup, Switch template, Download PDF, Clear data.
  - Edit: Undo, Redo, Cut, Copy, Paste, Select all.
  - View: Zoom, Show/hide rulers, Show/hide page breaks, Fit to width.
  - Insert: Link, Horizontal line, Page break, Special characters, Section (see below).
  - Format: Text styles, Align, Line and paragraph spacing, Lists, Clear formatting.
- Formatting toolbar: Undo, Redo, Zoom dropdown, Paragraph style dropdown (Normal, Heading 1/2/3), Font family dropdown, Font size (- / editable number / +), Bold, Italic, Underline, Strikethrough, Text color, Highlight color, Link, Align left/center/right/justify, Line spacing, Bulleted list, Numbered list, Indent/Outdent, Clear formatting.
- Canvas: light gray workspace background with a centered white page at the selected size, with a subtle border, like Google Docs. Page margins editable.
- Multi-page support: content flows onto additional pages automatically with visible page breaks; the PDF must match what is on screen (WYSIWYG).
- Optional rulers are nice to have.

Page setup (File > Page setup dialog, like Google Docs):
- Page size presets: A4 (default), A5, A3, Letter, Legal, Tabloid, Executive.
- Custom size: width and height inputs with unit selector (mm, cm, in, px).
- Orientation: portrait / landscape.
- Margins: top, bottom, left, right (individually editable, with unit), plus quick presets (Narrow, Normal, Wide).
- Page background color (default white).
- "Set as default" is not needed. Settings apply to the whole resume.
- The page on canvas, pagination, and the exported PDF must all update live to match the chosen size, orientation and margins. Content must reflow without breaking layout.

Typography and customization (fully flexible):
- Font family: a large list of safe/web fonts (Arial, Calibri-like, Cambria, Georgia, Times New Roman, Garamond, Helvetica, Verdana, Tahoma, Trebuchet MS, Courier New, plus a few self-hosted open-source fonts such as Open Sans, Lato, Roboto, Merriweather, Lora, Source Sans, loaded lazily only when selected). Show each font name in its own typeface in the dropdown. Include a "More fonts" option only if it does not hurt performance.
- Font size: free numeric input from 6 to 96 pt (decimals/half sizes allowed) plus +/- buttons, like Google Docs. Applies to selection or to the whole document.
- Editable default text styles: user can change and update Normal text, Heading 1, Heading 2, Heading 3 (font, size, color, bold/italic, spacing) and apply "Update style to match" like Google Docs.
- Line spacing: presets (1, 1.15, 1.5, 2) and custom value. Paragraph spacing before/after in pt. Optional letter spacing.
- Text color, highlight color, with a color picker and hex input plus a few recent colors.
- Section-level controls: heading style, divider line style/thickness/color, section spacing.
- Global "Apply font to entire resume" and "Scale all text" (increase/decrease all sizes proportionally) quick actions.
- Everything is editable: all text, fonts, sizes, colors, spacing, alignment, margins.
- Add, remove, reorder (move up/down or drag) sections: Contact info, Summary, Experience, Education, Skills, Projects, Certifications, Languages, Custom section.
- Add/remove entries inside sections (e.g. another job).
- Switch template while keeping the content and, where sensible, the page setup.
- Keyboard shortcuts like Google Docs: Ctrl/Cmd + B, I, U, Z, Y, K (link), Ctrl+Shift+7/8 for lists, Ctrl+Enter for page break, etc.
- Changes are kept in sessionStorage automatically (see Privacy / data rules). No "Saved" indicator is needed beyond the small privacy note.

## Performance and loading states
- Fast first load: code-split routes (Dashboard, Editor), lazy-load the PDF library only when the user clicks Download, lazy-load heavy editor extensions, color picker and non-default fonts.
- Keep the initial bundle small; no heavy UI libraries; system fonts for the app UI to avoid layout shifts and font blocking.
- Proper loading states: skeleton placeholders for the template grid and the editor, a spinner/progress indicator on "Download PDF" ("Preparing your PDF...") with the button disabled during generation, and friendly error states with a Retry option if PDF generation fails.
- Editing must feel instant: no lag while typing, debounce expensive re-pagination, avoid unnecessary re-renders (memoize components, use selectors in the store).
- Target: Lighthouse performance 90+, interactive in under 2 seconds on a normal connection.

## Quality requirements
- Accessible: keyboard navigable, visible focus states, proper aria labels and button semantics, sufficient contrast.
- Handle empty states, long text, and very long resumes gracefully.
- PDF output must be tested for every page size preset and for landscape: correct dimensions, no clipped text, fonts preserved, links clickable if possible.
- Clean folder structure (components, pages, store, templates, utils), typed code, no dead code, reusable components.
- Template system must be data-driven (each template = config + styles, independent of page size) so new templates are easy to add and all templates adapt to any page size.
- Leave clearly marked extension points for the future paid system (auth, saved resumes, premium templates) without implementing them.

## Deliverables
- Working app with the flow: Dashboard (template gallery) -> Editor -> PDF download.
- Brief README with setup, run, build instructions and an overview of the architecture.
- Before finishing, run the app, test the full flow (including page size changes, font changes and refresh persistence), fix console errors, and verify the downloaded PDFs.