# AGENTS.md

# Resume Project — Engineering Rules & Architecture

This document is the authoritative engineering specification for this repository.

The coding agent MUST follow these rules when creating, modifying, moving, deleting, or refactoring code.

Do not introduce a different architecture without explicit approval.

---

# 1. Project Goal

This project is a full-stack Resume/Profile application.

The application contains:

* Authentication
* User profile
* Education
* Work experience
* Skills
* Certificates
* Projects
* Social links
* Resume/profile presentation

Technology stack:

* Frontend: Next.js + React + TypeScript
* Backend: Python + FastAPI
* Authentication: Supabase Auth
* Database: PostgreSQL / Supabase
* Package manager: pnpm
* Monorepo: Turborepo

The architecture MUST be modular and feature-based.

---

# 2. Core Architectural Principle

The most important rule in this repository is:

> Every business feature/module owns all of its feature-specific code.

Examples:

```text
auth
profile
education
experience
skills
certificates
projects
social-links
```

Each module must contain its own:

* components
* API functions
* hooks
* types
* validation schemas
* constants
* feature-specific logic

Do NOT create one giant global folder containing feature-specific components.

---

# 3. Final Repository Structure

The target repository structure is:

```text
resume/
│
├── apps/
│   │
│   ├── frontend/
│   │   │
│   │   ├── app/
│   │   │   ├── modules/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── providers/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── styles/
│   │   ├── public/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── backend/
│       │
│       ├── app/
│       ├── tests/
│       ├── requirements.txt
│       ├── .env.example
│       └── pytest.ini
│
├── packages/
│
├── docs/
│
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── .gitignore
├── README.md
└── AGENTS.md
```

---

# 4. Frontend Architecture

The frontend MUST use module-based architecture.

Target:

```text
apps/frontend/
│
├── app/
│
├── modules/
│
├── components/
│
├── lib/
│
├── providers/
│
├── hooks/
│
├── types/
│
└── styles/
```

---

# 5. Frontend App Router

The Next.js `app/` directory is responsible primarily for routing and page composition.

Do not put large business logic inside `page.tsx`.

Example:

```text
app/
├── layout.tsx
├── page.tsx
│
├── auth/
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── verify-email/
│   │   └── page.tsx
│   ├── forgot-password/
│   │   └── page.tsx
│   └── reset-password/
│       └── page.tsx
│
├── dashboard/
│   └── page.tsx
│
└── profile/
    └── page.tsx
```

Pages should compose module components.

Example:

```tsx
import { LoginForm } from "@/modules/auth";

export default function LoginPage() {
  return <LoginForm />;
}
```

Do not put the complete authentication implementation into `page.tsx`.

---

# 6. Frontend Module Structure

Every feature must have its own directory under:

```text
apps/frontend/modules/
```

Required modules:

```text
modules/
├── auth/
├── profile/
├── education/
├── experience/
├── skills/
├── certificates/
├── projects/
└── social-links/
```

---

# 7. Auth Module

Structure:

```text
modules/auth/
│
├── components/
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   ├── VerifyEmailForm.tsx
│   ├── ForgotPasswordForm.tsx
│   └── ResetPasswordForm.tsx
│
├── api.ts
├── hooks.ts
├── types.ts
├── schemas.ts
├── constants.ts
└── index.ts
```

Rules:

* All authentication UI belongs here.
* All authentication API calls belong in `api.ts`.
* Authentication hooks belong in `hooks.ts`.
* Authentication TypeScript types belong in `types.ts`.
* Zod/client validation schemas belong in `schemas.ts`.
* Authentication constants belong in `constants.ts`.

Do not spread auth-specific code throughout the application.

---

# 8. Profile Module

Structure:

```text
modules/profile/
│
├── components/
│   ├── ProfileForm.tsx
│   ├── PersonalInfoForm.tsx
│   └── ProfileCard.tsx
│
├── api.ts
├── hooks.ts
├── types.ts
├── schemas.ts
├── constants.ts
└── index.ts
```

Profile-specific code must remain inside this module.

---

# 9. Education Module

```text
modules/education/
│
├── components/
│   ├── EducationForm.tsx
│   ├── EducationList.tsx
│   └── EducationCard.tsx
│
├── api.ts
├── hooks.ts
├── types.ts
├── schemas.ts
├── constants.ts
└── index.ts
```

---

# 10. Experience Module

```text
modules/experience/
│
├── components/
│   ├── ExperienceForm.tsx
│   ├── ExperienceList.tsx
│   └── ExperienceCard.tsx
│
├── api.ts
├── hooks.ts
├── types.ts
├── schemas.ts
├── constants.ts
└── index.ts
```

---

# 11. Skills Module

```text
modules/skills/
│
├── components/
│   ├── SkillForm.tsx
│   ├── SkillList.tsx
│   └── SkillCard.tsx
│
├── api.ts
├── hooks.ts
├── types.ts
├── schemas.ts
├── constants.ts
└── index.ts
```

---

# 12. Certificates Module

```text
modules/certificates/
│
├── components/
│   ├── CertificateForm.tsx
│   ├── CertificateList.tsx
│   └── CertificateCard.tsx
│
├── api.ts
├── hooks.ts
├── types.ts
├── schemas.ts
├── constants.ts
└── index.ts
```

Certificate upload logic must also belong to this module.

---

# 13. Projects Module

```text
modules/projects/
│
├── components/
│   ├── ProjectForm.tsx
│   ├── ProjectList.tsx
│   └── ProjectCard.tsx
│
├── api.ts
├── hooks.ts
├── types.ts
├── schemas.ts
├── constants.ts
└── index.ts
```

---

# 14. Social Links Module

```text
modules/social-links/
│
├── components/
│   ├── SocialLinkForm.tsx
│   ├── SocialLinkList.tsx
│   └── SocialLinkCard.tsx
│
├── api.ts
├── hooks.ts
├── types.ts
├── schemas.ts
├── constants.ts
└── index.ts
```

---

# 15. Frontend Shared Components

The global components directory is ONLY for reusable application-wide components.

```text
components/
│
├── ui/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Textarea.tsx
│   ├── Select.tsx
│   ├── Checkbox.tsx
│   ├── Modal.tsx
│   ├── Dialog.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Spinner.tsx
│   └── Skeleton.tsx
│
├── feedback/
│   ├── Toast.tsx
│   ├── Alert.tsx
│   └── ErrorMessage.tsx
│
├── layout/
│   ├── Header.tsx
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   └── Footer.tsx
│
└── common/
    ├── EmptyState.tsx
    ├── LoadingState.tsx
    ├── ConfirmDialog.tsx
    └── PageHeader.tsx
```

A component belongs here only if multiple modules can reasonably use it.

Example:

```text
Button
Toast
Modal
Input
Card
Dialog
Spinner
```

belong in shared components.

A component such as:

```text
EducationCard
LoginForm
ProjectForm
CertificateCard
```

MUST NOT be placed in the global components folder.

---

# 16. Frontend API Client

Create:

```text
apps/frontend/lib/api-client.ts
```

This is the central HTTP client.

Feature API calls belong inside their module:

```text
modules/auth/api.ts
modules/profile/api.ts
modules/education/api.ts
modules/experience/api.ts
modules/skills/api.ts
modules/certificates/api.ts
modules/projects/api.ts
modules/social-links/api.ts
```

Example:

```text
Component
    ↓
Hook
    ↓
module/api.ts
    ↓
lib/api-client.ts
    ↓
FastAPI
```

Components should not contain repeated raw `fetch()` calls.

---

# 17. Frontend Hooks

Feature-specific hooks belong to their module.

Example:

```text
modules/education/hooks.ts
```

can contain:

```text
useEducations()
useEducation()
useCreateEducation()
useUpdateEducation()
useDeleteEducation()
```

Global reusable hooks belong in:

```text
hooks/
```

Examples:

```text
useDebounce
useMediaQuery
useClickOutside
```

---

# 18. Frontend Types

Feature-specific types belong inside the module:

```text
modules/profile/types.ts
modules/education/types.ts
modules/experience/types.ts
modules/skills/types.ts
modules/projects/types.ts
```

Only genuinely shared types belong in:

```text
types/
```

---

# 19. Backend Architecture

The backend MUST also be module based.

Target:

```text
apps/backend/app/
│
├── main.py
├── core/
├── database/
├── integrations/
├── common/
└── modules/
```

---

# 20. Backend Core

```text
core/
├── config.py
├── security.py
├── exceptions.py
└── logging.py
```

Responsibilities:

### config.py

Environment configuration.

### security.py

Security helpers and authentication-related security utilities.

### exceptions.py

Application-level exceptions.

### logging.py

Central logging configuration.

Do not put business feature logic here.

---

# 21. Backend Database

Structure:

```text
database/
│
├── connection.py
├── migration_runner.py
│
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_indexes.sql
    └── 003_rls.sql
```

---

# 22. Database Rule

Do NOT write large SQL statements directly inside:

```text
main.py
service.py
router.py
repository.py
```

SQL schema definitions MUST live in migration files.

The backend migration runner is responsible for applying them.

---

# 23. Migration System

Create:

```text
database/migration_runner.py
```

It must:

1. Connect to PostgreSQL.
2. Create `schema_migrations` if it does not exist.
3. Find migration `.sql` files.
4. Sort migrations by version.
5. Check which migrations have already been applied.
6. Execute only pending migrations.
7. Record successfully applied migrations.

Migration tracking table:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(100) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Do not execute an already-applied migration again.

---

# 24. Initial Database Schema

Create:

```text
database/migrations/001_initial_schema.sql
```

It must create:

```text
profiles
educations
experiences
skills
certificates
projects
social_links
```

---

# 25. Database Relationship

Supabase owns authentication.

Do NOT create a second password/user authentication system.

The relationship is:

```text
auth.users
    │
    ├── profiles
    ├── educations
    ├── experiences
    ├── skills
    ├── certificates
    ├── projects
    └── social_links
```

Application tables reference:

```text
auth.users.id
```

---

# 26. Profiles Table

Use:

```sql
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(320),
    phone VARCHAR(20),
    address TEXT,

    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

# 27. Education Table

Use:

```sql
CREATE TABLE IF NOT EXISTS educations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    institution VARCHAR(255) NOT NULL,
    degree VARCHAR(255),
    field_of_study VARCHAR(255),

    start_date DATE,
    end_date DATE,

    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

# 28. Experience Table

Use:

```sql
CREATE TABLE IF NOT EXISTS experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    company VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    location VARCHAR(255),

    start_date DATE,
    end_date DATE,

    is_current BOOLEAN NOT NULL DEFAULT FALSE,

    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

# 29. Skills Table

Use:

```sql
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    name VARCHAR(150) NOT NULL,
    category VARCHAR(100),
    level VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, name)
);
```

---

# 30. Certificates Table

Use:

```sql
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255),

    issue_date DATE,
    expiration_date DATE,

    credential_id VARCHAR(255),
    credential_url TEXT,

    file_path TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

# 31. Projects Table

Use:

```sql
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    url TEXT,
    github_url TEXT,

    start_date DATE,
    end_date DATE,

    technologies TEXT[],

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

# 32. Social Links Table

Use:

```sql
CREATE TABLE IF NOT EXISTS social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    platform VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

# 33. Database Indexes

Create:

```text
database/migrations/002_indexes.sql
```

Add:

```sql
CREATE INDEX IF NOT EXISTS idx_educations_user_id
ON educations(user_id);

CREATE INDEX IF NOT EXISTS idx_experiences_user_id
ON experiences(user_id);

CREATE INDEX IF NOT EXISTS idx_skills_user_id
ON skills(user_id);

CREATE INDEX IF NOT EXISTS idx_certificates_user_id
ON certificates(user_id);

CREATE INDEX IF NOT EXISTS idx_projects_user_id
ON projects(user_id);

CREATE INDEX IF NOT EXISTS idx_social_links_user_id
ON social_links(user_id);
```

---

# 34. Row Level Security

Create:

```text
database/migrations/003_rls.sql
```

Enable RLS:

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
```

Users must only be able to access their own records.

---

# 35. RLS Policies

Profile:

```sql
CREATE POLICY "Users manage own profile"
ON profiles
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

Education:

```sql
CREATE POLICY "Users manage own education"
ON educations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

Apply equivalent ownership policies to:

```text
experiences
skills
certificates
projects
social_links
```

---

# 36. Backend Module Structure

Each business module must have:

```text
router.py
service.py
repository.py
schemas.py
models.py
errors.py
```

Example:

```text
modules/education/
├── router.py
├── service.py
├── repository.py
├── schemas.py
├── models.py
└── errors.py
```

---

# 37. Router Responsibility

`router.py` is responsible for:

* HTTP endpoints
* request parsing
* authentication dependencies
* calling service methods
* response serialization

Router code MUST remain thin.

Do not put complex database logic in routers.

Bad:

```python
@router.post("/")
async def create(data):
    # validation
    # SQL
    # transformation
    # business rules
    # response
```

Good:

```python
@router.post("/")
async def create(
    data: CreateEducationRequest,
    current_user = Depends(get_current_user)
):
    return await education_service.create(
        current_user.id,
        data
    )
```

---

# 38. Service Responsibility

`service.py` contains business logic.

Example:

```text
router
  ↓
service
  ↓
repository
```

The service is responsible for:

* business rules
* validation beyond schema validation
* ownership checks
* coordinating multiple repositories
* application workflows

---

# 39. Repository Responsibility

`repository.py` is responsible for database operations.

Examples:

```text
create()
get_by_id()
get_all_by_user()
update()
delete()
```

Repositories MUST receive the authenticated user's ID when working with user-owned data.

---

# 40. Ownership Security

Never trust a `user_id` supplied by the frontend.

Bad:

```json
{
    "user_id": "another-user"
}
```

The authenticated user must come from the server-side authentication dependency.

Use:

```python
current_user.id
```

for ownership.

Every query must enforce ownership.

Example:

```sql
SELECT *
FROM educations
WHERE id = :education_id
AND user_id = :current_user_id;
```

Never query only by ID for user-owned resources.

---

# 41. Authentication

Use Supabase Auth.

Do NOT implement custom:

* password hashing
* JWT generation
* refresh-token generation
* email verification tokens

Supabase Auth is responsible for these authentication functions.

---

# 42. Authentication Module

Backend:

```text
modules/auth/
├── router.py
├── service.py
├── schemas.py
├── dependencies.py
├── cookies.py
├── errors.py
└── constants.py
```

Authentication endpoints:

```text
POST /api/v1/auth/register
POST /api/v1/auth/verify-email
POST /api/v1/auth/resend-verification
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/forgot-password
POST /api/v1/auth/verify-recovery-otp
POST /api/v1/auth/change-password
```

---

# 43. Authentication Cookies

Authentication tokens must use secure cookies.

Production:

```text
HttpOnly = true
Secure = true
SameSite = appropriate
```

Never store authentication tokens in:

```text
localStorage
sessionStorage
URL
React state
Redux
Zustand
```

Do not return refresh tokens in JSON responses.

---

# 44. Authentication Validation

Registration must validate:

```text
name
email
phone
password
confirm_password
```

Password requirements:

```text
8-128 characters
uppercase
lowercase
number
special character
```

Email must be normalized/lowercased.

Never log passwords.

Never return passwords.

Never store passwords in application tables.

---

# 45. Authentication Error Security

Do not reveal whether an account exists.

Bad:

```text
Email does not exist.
```

Use generic messages.

Login:

```text
Invalid email or password.
```

Forgot password:

```text
If an account exists for this email, recovery instructions have been sent.
```

This prevents account enumeration.

---

# 46. Rate Limiting

Rate limit:

```text
/register
/login
/verify-email
/resend-verification
/forgot-password
/verify-recovery-otp
```

Development may use an in-memory implementation.

Production should use a shared store such as Redis.

---

# 47. CORS

Only allow trusted frontend origins.

Never use unrestricted:

```text
allow_origins=["*"]
```

with credentialed authentication.

Use an environment variable:

```text
FRONTEND_URL
```

and configure CORS from it.

---

# 48. CSRF

Because authentication uses cookies, evaluate CSRF protection carefully.

Do not assume CORS alone protects against CSRF.

For state-changing requests consider:

```text
POST
PUT
PATCH
DELETE
```

using an appropriate CSRF strategy.

---

# 49. Error Handling

Never return:

```text
Python traceback
SQL exception
Supabase internal exception
database credentials
tokens
passwords
```

to the frontend.

Return safe structured errors.

Example:

```json
{
  "error": {
    "code": "EDUCATION_NOT_FOUND",
    "message": "Education record not found."
  }
}
```

Log detailed internal errors server-side.

---

# 50. API Versioning

Use:

```text
/api/v1/
```

Example:

```text
/api/v1/auth/login
/api/v1/profile
/api/v1/education
/api/v1/experience
/api/v1/skills
/api/v1/certificates
/api/v1/projects
/api/v1/social-links
```

---

# 51. Frontend/Backend Module Mapping

The frontend and backend modules should correspond.

```text
Frontend                     Backend

modules/auth          →     modules/auth
modules/profile       →     modules/profile
modules/education     →     modules/education
modules/experience    →     modules/experience
modules/skills        →     modules/skills
modules/certificates  →     modules/certificates
modules/projects      →     modules/projects
modules/social-links  →     modules/social_links
```

This makes the application easy to understand.

---

# 52. No Cross-Module Spaghetti

Do not allow:

```text
education → random profile files
projects → auth implementation
skills → certificate internals
```

Modules should communicate through:

* exported functions
* hooks
* API clients
* shared types where appropriate

Avoid circular dependencies.

---

# 53. File Naming

Frontend:

```text
PascalCase.tsx
camelCase.ts
```

Examples:

```text
LoginForm.tsx
EducationCard.tsx
api.ts
hooks.ts
schemas.ts
types.ts
```

Backend:

```text
snake_case.py
```

Examples:

```text
router.py
service.py
repository.py
schemas.py
dependencies.py
```

---

# 54. No Unnecessary Abstractions

Do not create folders/files simply to make the tree look large.

For example, if a module needs only:

```text
api.ts
hooks.ts
types.ts
components/
```

do not create five empty abstraction layers.

Architecture should serve maintainability.

---

# 55. Shared Component Rule

Before adding a component to:

```text
components/
```

ask:

> Can at least two unrelated modules reasonably use this component?

If yes:

```text
components/
```

If no:

```text
modules/<feature>/components/
```

---

# 56. Database Rule

Do not use SQLite for production application profile data.

Use PostgreSQL/Supabase.

Remove or migrate away from:

```text
profile.sqlite3
PROFILE_DATABASE_PATH
```

once the PostgreSQL migration is implemented.

---

# 57. Migration Safety

Migration files are append-only.

Never casually edit an already-applied migration.

Bad:

```text
001_initial_schema.sql
```

was already deployed and then modified.

Instead create:

```text
004_add_profile_avatar.sql
```

for the next change.

---

# 58. Database Transactions

Use transactions for operations that modify multiple related records.

If one operation fails, the related changes should roll back.

---

# 59. File Upload Security

Certificates or other uploaded files must:

* have a maximum file size
* validate MIME type
* validate extension
* validate file signature where appropriate
* use generated storage names
* never trust user filenames
* never execute uploaded files
* avoid exposing private storage directly

File upload logic belongs to:

```text
modules/certificates/
```

or the appropriate feature module.

---

# 60. Environment Variables

Commit:

```text
.env.example
```

Do not commit:

```text
.env
.env.local
```

Never expose backend secrets to Next.js client-side code.

Never expose:

```text
SUPABASE_SERVICE_ROLE_KEY
DATABASE_PASSWORD
PRIVATE_API_KEY
```

to the browser.

---

# 61. Testing

Every module should have backend tests.

Example:

```text
tests/
├── auth/
├── profile/
├── education/
├── experience/
├── skills/
├── certificates/
├── projects/
└── social_links/
```

Test:

* success
* validation failures
* authentication failures
* authorization failures
* not-found behavior
* database errors

---

# 62. Mandatory Security Tests

The following MUST be tested:

```text
User A cannot read User B's profile.

User A cannot modify User B's profile.

User A cannot delete User B's education.

User A cannot modify User B's experience.

User A cannot access User B's projects.

Expired authentication is rejected.

Invalid authentication is rejected.

Invalid OTP is rejected.

Expired OTP is rejected.

Login errors do not reveal account existence.

Forgot-password responses do not reveal account existence.

Passwords never appear in API responses.

Tokens never appear in API responses.

Secrets never appear in logs.
```

---

# 63. Refactoring Existing Code

When modifying the existing repository:

1. Inspect existing code before changing it.
2. Preserve working behavior unless it violates this architecture.
3. Move code rather than duplicating it.
4. Update imports after moving files.
5. Update API routes if necessary.
6. Update tests.
7. Run lint/typecheck/tests.
8. Remove obsolete files after migration.
9. Do not leave duplicate implementations.

---

# 64. Do Not Break Authentication During Refactoring

Authentication is security-sensitive.

Before changing auth:

* inspect existing implementation
* understand Supabase integration
* preserve cookie behavior
* preserve OTP behavior
* preserve refresh behavior
* preserve logout behavior
* preserve password recovery behavior

Do not replace Supabase Auth with custom authentication.

---

# 65. Implementation Order

When restructuring the project, use this order:

```text
1. Inspect current repository
2. Create target directory structure
3. Move frontend modules
4. Fix frontend imports
5. Create shared components structure
6. Move backend modules
7. Create database migration system
8. Create PostgreSQL schema
9. Add indexes
10. Add RLS
11. Connect repositories
12. Connect services
13. Connect routers
14. Connect frontend API files
15. Update hooks
16. Update pages
17. Add tests
18. Run lint
19. Run typecheck
20. Run backend tests
21. Run frontend build
22. Remove obsolete code
23. Update documentation
```

---

# 66. Definition of Done

The refactor is complete only when:

```text
[ ] Frontend follows module architecture.

[ ] Every feature has its own module.

[ ] Feature-specific components are inside their module.

[ ] Shared UI components are inside components/.

[ ] Each frontend module has api.ts.

[ ] Each frontend module has hooks.ts where hooks are needed.

[ ] Each frontend module has types.ts.

[ ] Each frontend module has schemas.ts where validation is needed.

[ ] Backend follows module architecture.

[ ] Routers are thin.

[ ] Services contain business logic.

[ ] Repositories contain database access.

[ ] Authentication remains Supabase-based.

[ ] Authentication uses secure HttpOnly cookies.

[ ] User ownership is enforced.

[ ] PostgreSQL is used for application data.

[ ] SQLite profile storage is removed.

[ ] SQL migrations exist.

[ ] Migration runner exists.

[ ] Database tables are automatically created/applied through migrations.

[ ] Foreign keys exist.

[ ] Indexes exist.

[ ] RLS exists.

[ ] CORS is restricted.

[ ] Rate limiting exists.

[ ] CSRF protection is appropriately implemented.

[ ] Secrets are not exposed.

[ ] File uploads are validated.

[ ] Tests exist for every major module.

[ ] Authorization tests exist.

[ ] Frontend typecheck passes.

[ ] Frontend build passes.

[ ] Backend tests pass.

[ ] Documentation is updated.
```

---

# 67. Golden Rule

When adding a new feature in the future, follow this pattern.

Frontend:

```text
modules/new-feature/
├── components/
├── api.ts
├── hooks.ts
├── types.ts
├── schemas.ts
├── constants.ts
└── index.ts
```

Backend:

```text
modules/new_feature/
├── router.py
├── service.py
├── repository.py
├── schemas.py
├── models.py
└── errors.py
```

Database:

```text
database/migrations/
└── 00X_new_feature.sql
```

Never put feature-specific code into unrelated modules.

---

# 68. Final Architecture

The final application should follow:

```text
                    FRONTEND
                       │
                       ▼
             ┌────────────────────┐
             │ Next.js App Router │
             └─────────┬──────────┘
                       │
                       ▼
             ┌────────────────────┐
             │ Feature Modules    │
             │                    │
             │ auth               │
             │ profile            │
             │ education          │
             │ experience         │
             │ skills             │
             │ certificates       │
             │ projects           │
             │ social-links       │
             └─────────┬──────────┘
                       │
                       ▼
                 API Client
                       │
                       ▼
                    FASTAPI
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
       Authentication       Business Modules
             │                   │
             ▼                   ▼
       Supabase Auth       Services
                                 │
                                 ▼
                            Repositories
                                 │
                                 ▼
                           PostgreSQL
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
              Application Tables          RLS
```

This architecture is the required target for the project.

Any future implementation should preserve this separation of concerns.
