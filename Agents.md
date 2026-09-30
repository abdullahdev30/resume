You are working on my existing Resume Builder project. I want you to perform a COMPLETE frontend/backend integration audit and implementation.

Do NOT just patch one screen. Inspect the entire repository, understand the existing architecture, frontend, backend, database models, authentication flow, resume flow, profile flow, and all existing APIs before making changes.

## MAIN GOAL

Remove all dummy, mock, hardcoded, cached, localStorage-based, sessionStorage-based, or temporary frontend data that is being used as application data and replace it with REAL data coming from the backend APIs/database.

After this task:

Frontend → Backend API → Database

must be the source-of-truth flow.

The UI must always show the actual data belonging to the currently authenticated user.

Do NOT create duplicate APIs if equivalent backend APIs already exist.

---

# 1. FIRST AUDIT THE ENTIRE PROJECT

Before modifying code, inspect:

- Entire frontend folder
- Entire backend folder
- API routes/endpoints
- Authentication implementation
- Database models/schema
- User/profile module
- Resume module
- Resume templates
- AI resume module if present
- API client/services/hooks
- State management
- localStorage usage
- sessionStorage usage
- browser cache-based application state
- hardcoded objects/arrays
- mock JSON
- fake/sample data
- dummy user/profile/resume data
- temporary development data
- frontend forms
- save/update/delete actions
- loading/error states

Search the entire frontend for things such as:

localStorage
sessionStorage
mockData
dummyData
sampleData
fakeData
defaultData
hardcoded user objects
hardcoded resume objects
hardcoded profile objects
temporary arrays
static API response objects

Do not blindly delete browser storage if it is legitimately needed for authentication/session handling.

The requirement is:

APPLICATION DATA must come from backend APIs/database.

Auth tokens/session information may continue using the project's existing secure authentication approach.

---

# 2. BACKEND API AUDIT

Inspect ALL backend modules and endpoints.

Create an internal mapping like:

Backend Endpoint
→ Purpose
→ Request body
→ Response
→ Authentication requirement
→ Frontend screen/component that should use it
→ Whether it is currently integrated

Then integrate every relevant existing backend API into the frontend.

Examples include, but are not limited to:

- authentication
- signup
- login
- logout
- current user
- profile
- update profile
- resumes
- create resume
- get resume
- get user's resumes
- update resume
- delete resume
- resume sections
- templates
- generated resumes
- AI resume generation
- upload endpoints
- PDF endpoints
- any other existing user-facing backend functionality

Do not assume endpoint names. Read the backend source code and use the actual endpoints.

If an API exists but is broken, fix it properly.

If frontend functionality requires an API that genuinely does not exist, implement it following the existing backend architecture instead of creating frontend workarounds.

---

# 3. REMOVE FRONTEND DUMMY/HARDCODED DATA

Remove application-data dependencies on:

- localStorage
- sessionStorage
- hardcoded resume data
- hardcoded user data
- hardcoded profile information
- fake API responses
- mock resume lists
- mock dashboard statistics
- sample user resumes displayed as real resumes
- temporary development JSON
- fake save operations

For example, this is NOT acceptable:

const resumes = [...]

or:

const userProfile = {
  name: "...",
  email: "..."
}

when this information should come from the backend.

Replace these with proper API calls.

Static UI configuration is allowed to remain hardcoded where appropriate.

Examples:

- navigation items
- labels
- dropdown options
- static template definitions when they are intentionally frontend assets
- constants
- UI configuration

Do not confuse static UI configuration with application/user data.

---

# 4. CREATE A CLEAN API LAYER

Do not scatter random fetch() calls throughout components.

Use the project's existing API architecture if one already exists.

Otherwise create a clean centralized structure such as:

services/
api/
hooks/

For example:

authService
profileService
resumeService
templateService
aiResumeService

Use the existing project conventions.

Centralize:

- backend base URL
- authentication headers
- JSON handling
- error parsing
- request handling

Do not duplicate API logic.

---

# 5. AUTHENTICATED USER DATA

Every user-specific request must use the authenticated user's identity/session.

A logged-in user must ONLY see their own:

- profile
- resumes
- generated resumes
- uploaded files
- resume data
- related resources

Never use hardcoded user IDs.

Never trust a frontend-supplied user ID if the backend can identify the user from the authenticated session/token.

Check backend authorization as well.

User A must not be able to retrieve/update/delete User B's resume by changing an ID in the URL/request.

---

# 6. PROFILE DATA

The user's profile must come from the backend.

When opening the profile screen:

1. Show a loading state.
2. Fetch authenticated user's profile.
3. Populate the form with API data.
4. Allow editing.
5. Save changes through backend API.
6. Show saving state.
7. Handle success.
8. Handle API errors properly.
9. Refresh/update frontend state using the returned backend data.

Do not pretend a save succeeded before the backend confirms it.

---

# 7. AUTO-FILL NEW RESUME FROM PROFILE

This is VERY IMPORTANT.

When the logged-in user clicks:

Create New Resume

fetch/reuse their current backend profile and initialize the new resume with the profile information automatically.

For example, where available:

- full name
- first name
- last name
- email
- phone
- location/address
- professional title
- summary/about
- website
- LinkedIn
- GitHub
- portfolio
- education
- experience
- skills
- languages
- other relevant profile fields

Map only fields that actually exist in the project's profile/resume models.

Do not invent fake information.

The profile information is ONLY the starting/default resume data.

After creating the resume, the user must be able to edit it independently.

Changing:

John Doe

to:

John A. Doe

inside Resume A must NOT automatically modify the user's master profile unless the user explicitly chooses to update their profile.

Likewise, later profile changes should not silently overwrite an existing resume.

The intended behavior is:

User Profile
↓
Create New Resume
↓
Copy relevant profile information
↓
Create independent editable resume

Use a snapshot/copy approach, not a permanently linked object that unexpectedly changes existing resumes.

---

# 8. NEW RESUME CREATION FLOW

Implement a reliable flow:

User clicks "Create New Resume"

→ Show creating/loading state

→ Obtain current user profile

→ Prepare initial resume data

→ Call backend create-resume API

→ Backend creates resume in database

→ Receive real resume ID/data

→ Navigate to the resume editor using the REAL backend resume ID

→ Populate editor with returned backend data

Never create fake frontend-only resume IDs.

Never rely on localStorage as the resume database.

---

# 9. RESUME EDITOR

When opening:

/resume/[id]

or the project's equivalent route:

1. Read the real resume ID.
2. Show loading/skeleton state.
3. Request that resume from backend.
4. Populate editor with API response.
5. Allow editing.
6. Save through update API.
7. Update UI with backend-confirmed data.
8. Handle unauthorized/not-found states properly.

Refreshing the browser must NOT erase the resume.

Opening the same resume on another browser/device after login should retrieve the saved backend version.

---

# 10. SAVE BUTTON UX

Every Save/Update action needs proper visual feedback.

Required button states:

Normal:

Save

While request is running:

[spinner] Saving...

The button must be disabled while the same save request is running.

On success:

Saved ✓

The success state may briefly display and then return to:

Save

On failure:

Do NOT show "Saved".

Show an appropriate error/toast/message and allow retry.

Example conceptual implementation:

idle
saving
success
error

Do not use only console.log() as feedback.

The user must visually know:

- save started
- save is processing
- save succeeded
- save failed

Prevent accidental duplicate submissions.

---

# 11. LOADING UX

Add proper loading states for API-backed screens.

Examples:

Profile loading:
"Loading profile..."

Resume loading:
"Loading resume..."

Dashboard:
use appropriate skeleton/loading UI.

Buttons:
spinner + action text.

Examples:

Creating...
Saving...
Updating...
Deleting...
Generating...
Uploading...

Do not show fake/default data while the actual API request is still loading.

This prevents UI flicker where dummy information appears before real information.

---

# 12. UNSAVED CHANGES

For the resume editor, track dirty/unsaved state if compatible with the existing architecture.

Possible state:

Saved
Unsaved changes
Saving...
Saved ✓
Save failed

Do not mark the document as saved merely because frontend state changed.

"Saved" means the backend confirmed persistence.

---

# 13. DASHBOARD / RESUME LIST

The dashboard/resume listing must use the real backend.

Fetch the authenticated user's resumes.

For each resume display actual available fields such as:

- title/name
- template
- created date
- updated date
- status
- thumbnail/preview if supported

Actions such as:

Open
Edit
Delete
Duplicate
Download

must use real backend data/APIs where the functionality exists.

Remove fake resume cards.

If the user has no resumes, show a proper empty state such as:

"No resumes yet. Create your first resume."

Do not fill the screen with dummy resumes.

---

# 14. DELETE OPERATIONS

For delete actions:

User clicks Delete
→ confirmation if appropriate
→ show deleting state
→ call backend
→ wait for confirmation
→ remove item from UI
→ show success

If backend deletion fails, restore/retain the item and show an error.

---

# 15. DATA CONSISTENCY

Avoid situations where:

frontend says saved
but backend failed.

The backend/database is the source of truth.

After mutations, either:

- update state using the API response, or
- re-fetch/revalidate the affected resource.

Use whichever approach best matches the existing architecture.

---

# 16. API ERROR HANDLING

Implement proper handling for:

400
401
403
404
409
422
429
500+
network failures
timeouts where applicable

Do not expose raw backend stack traces to users.

Keep detailed developer errors available in development logs while showing clean UI messages.

If authentication expires, use the existing auth/session strategy to handle it correctly.

---

# 17. FORM VALIDATION

Keep frontend validation for good UX, but backend validation remains authoritative.

Display backend validation errors near the appropriate fields when possible.

Do not silently discard validation errors.

---

# 18. TYPES / SCHEMAS

Frontend data types/interfaces must match actual backend responses.

Do not create types based on guessed API structures.

Inspect backend:

- Pydantic schemas
- models
- response models
- serializers
- actual JSON responses

and align frontend TypeScript types accordingly.

Avoid excessive `any`.

---

# 19. CACHE BEHAVIOR

Do not use stale cached user/resume data as the authoritative source.

If the framework/API library uses caching, configure user-specific dynamic data correctly.

Profile/resume screens should not accidentally display another stale version after saving.

Invalidate/revalidate relevant queries after:

- profile update
- resume creation
- resume update
- resume deletion
- AI generation
- uploads

Use the project's existing data-fetching library if one exists.

Do NOT unnecessarily disable every type of caching globally.

---

# 20. DO NOT BREAK AUTHENTICATION

Before removing localStorage/sessionStorage code, determine whether it is used for authentication.

Do not delete authentication tokens blindly.

Separate:

AUTH/SESSION STORAGE

from:

APPLICATION DATA STORAGE.

Only migrate application data that belongs in the backend/database.

Keep authentication working.

If there are security problems in the current token handling, improve them only if this can be done consistently with the existing backend authentication architecture.

---

# 21. PRESERVE EXISTING DESIGN

Do NOT redesign the application.

Keep:

- existing layout
- colors
- typography
- responsiveness
- component design
- navigation
- resume templates
- editor appearance

Only add necessary UX elements such as:

- loaders
- spinners
- disabled states
- skeletons
- success/error messages
- empty states

Do not unnecessarily rewrite working UI components.

---

# 22. BACKEND VERIFICATION

Do not only integrate endpoints.

Verify that they actually work.

For each relevant endpoint verify:

- route exists
- HTTP method is correct
- auth works
- request schema is correct
- response schema is correct
- database operation works
- ownership/security works
- errors are handled
- frontend sends the correct payload
- frontend correctly consumes the response

Fix backend issues you discover that prevent real frontend integration.

---

# 23. END-TO-END TEST FLOW

After implementation, test the complete flow.

TEST 1 — Authentication

Signup/login
→ authenticated session established
→ current user retrieved.

TEST 2 — Profile

Open profile
→ backend profile loads
→ edit information
→ click Save
→ Saving... appears
→ backend updates
→ Saved ✓ appears
→ refresh browser
→ updated information remains.

TEST 3 — New Resume

Click Create New Resume
→ loading state
→ user profile information is automatically copied into initial resume
→ backend creates resume
→ real resume ID returned
→ editor opens
→ profile information is visible.

TEST 4 — Resume Editing

Modify resume
→ unsaved state
→ click Save
→ spinner + Saving...
→ API request
→ backend/database update
→ Saved ✓
→ refresh
→ modifications remain.

TEST 5 — Independent Resume

Change name/content inside resume
→ save resume
→ profile should remain unchanged unless explicitly updating profile.

TEST 6 — Dashboard

Return to dashboard
→ newly created resume appears from backend
→ no dummy cards.

TEST 7 — Delete

Delete resume
→ backend deletes it
→ UI updates
→ refresh
→ deleted resume does not return.

TEST 8 — New Session

Logout/login again
→ profile and resumes load from backend
→ data does not depend on previous browser localStorage application data.

TEST 9 — Ownership

Try accessing another/non-owned resume ID
→ backend must deny/not expose it.

TEST 10 — API Failure

Simulate/handle failed save
→ button must not display Saved
→ user receives an error
→ their unsaved form data should not unnecessarily disappear.

---

# 24. REMOVE DEAD CODE AFTER MIGRATION

After successful integration, remove obsolete:

- mock services
- dummy JSON
- fake API functions
- unnecessary localStorage application-data helpers
- unused hooks
- duplicate API clients
- dead imports
- old temporary state
- commented-out mock implementations

Do not leave two competing implementations.

---

# 25. IMPORTANT IMPLEMENTATION RULES

DO NOT:

- rewrite the whole project unnecessarily
- change the UI design unnecessarily
- create duplicate backend endpoints
- hardcode user IDs
- hardcode resume IDs
- fake successful saves
- use random fake data
- store resumes only in localStorage
- store profile only in localStorage
- use frontend data as the database
- guess API response formats
- hide TypeScript/Python errors using unsafe workarounds
- remove authentication storage without understanding it
- mark data saved before backend confirmation

DO:

- understand existing code first
- reuse existing architecture
- integrate existing backend APIs
- fix broken APIs when necessary
- keep backend as source of truth
- add loading states
- add saving states
- add proper errors
- use authenticated user context
- enforce backend ownership
- preserve existing design
- keep code maintainable

---

# 26. FINAL PROJECT-WIDE SEARCH

Before considering the task complete, search the entire frontend again for:

localStorage
sessionStorage
mock
dummy
fake
sample
hardcoded
TODO
temporary

Review every occurrence.

Do not automatically remove legitimate occurrences.

Determine whether each one represents:

1. legitimate UI/static configuration,
2. authentication/session handling,
3. development-only code,
4. application data that should have been replaced by backend data.

There should be NO remaining production user/resume/profile data being sourced from mocks or browser storage.

---

# 27. FINAL REPORT

After finishing, provide me with a concise implementation report containing:

1. Backend APIs discovered
2. Backend APIs integrated
3. Backend APIs fixed
4. New APIs created, if genuinely necessary, and why
5. Frontend files modified
6. Backend files modified
7. localStorage/sessionStorage application-data usage removed
8. Mock/hardcoded data removed
9. Loading/saving UX added
10. Profile → new resume auto-fill implementation
11. Authentication behavior
12. Resume ownership/security verification
13. Remaining issues/TODOs, if any
14. Exact end-to-end flows tested
15. Any endpoints that could not be integrated and the exact reason

IMPORTANT:

Do not tell me something is working simply because the code looks correct.

Run the project/tests/type checking/linting/build commands available in the repository and verify the implementation as much as the local environment allows.

Fix errors caused by your changes.

Do not stop after changing a few components. This is a project-wide frontend/backend integration task.

The final result must use REAL authenticated backend/database data throughout the Resume Builder, with proper loading, saving, success, failure, and empty states and with new resumes automatically initialized from the user's real profile information.