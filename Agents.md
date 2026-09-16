You are working on an existing Turborepo project.

Frontend:
- Next.js

Backend:
- Python
- FastAPI

Authentication provider:
- Supabase Auth
- Use Supabase Authentication module only.
- Do NOT create a custom users/authentication table.
- Do NOT manually write to auth.users.
- Do NOT implement custom password hashing, JWT generation, refresh-token generation, or email-token generation.
- Supabase Auth must handle authentication.

IMPORTANT:
The backend already has a module-based folder structure. Inspect the existing files first and preserve this architecture. Do not rebuild the backend into a different architecture.

Current backend structure:

apps/backend/
│
├── app/
│   ├── __init__.py
│   ├── main.py
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py
│   │
│   ├── integrations/
│   │   ├── __init__.py
│   │   └── supabase.py
│   │
│   └── modules/
│       ├── __init__.py
│       │
│       └── auth/
│           ├── __init__.py
│           ├── schemas.py
│           ├── service.py
│           ├── router.py
│           ├── dependencies.py
│           ├── cookies.py
│           └── errors.py
│
├── tests/
│   └── auth/
│       └── test_auth.py
│
├── .env
├── requirements.txt
└── venv/

==================================================
GOAL
==================================================

Complete the Auth module using Supabase Auth.

Implement:

1. Account registration
2. Email OTP verification
3. Resend verification OTP
4. Login using email + password
5. Current authenticated user endpoint
6. Refresh session/token
7. Logout
8. Forgot password
9. Verify password-recovery OTP
10. Change/reset password
11. Secure token/session handling
12. Proper request/data validation
13. Proper security controls
14. Proper error handling
15. Unit/API tests for Auth

Do NOT implement frontend UI.

Do NOT implement application database tables yet.

Do NOT use the PostgreSQL Session Pooler in this Auth module.

Supabase Auth API is responsible for Auth.

==================================================
AUTH ARCHITECTURE
==================================================

Keep responsibilities separated.

app/main.py
- Create FastAPI application.
- Register Auth router.
- Configure CORS.
- Configure global middleware/security where appropriate.
- Do not put Auth business logic here.

app/core/config.py
- Read environment variables.
- Validate required configuration.
- Keep secrets/configuration centralized.
- Never hard-code Supabase credentials.

app/integrations/supabase.py
- Create Supabase Auth clients.
- Do not put registration/login business logic here.
- Avoid sharing authenticated user session state globally between different requests.
- Prefer creating an isolated client per Auth operation.
- Configure persist_session/auto-refresh appropriately for backend usage.

app/modules/auth/schemas.py
- Define all Pydantic request/response schemas.
- Perform structural/input validation and normalization.

app/modules/auth/service.py
- Implement Auth business/application logic.
- All Supabase Auth SDK operations belong here.

app/modules/auth/router.py
- Define HTTP endpoints.
- Convert service results into controlled HTTP responses.
- Do not put large amounts of business logic here.

app/modules/auth/dependencies.py
- Authentication dependencies.
- Retrieve and validate current authenticated user.
- Protect authenticated endpoints.

app/modules/auth/cookies.py
- Centralize secure access-token and refresh-token cookie handling.
- Do not duplicate cookie configuration across routes.

app/modules/auth/errors.py
- Convert Supabase/Auth errors into safe application HTTP errors.
- Never expose stack traces, secret keys, raw internal errors, or sensitive information to clients.

tests/auth/test_auth.py
- Test validation, routes, service behavior, authentication protection, errors, and security-sensitive behavior.

==================================================
ACCOUNT REGISTRATION REQUIREMENTS
==================================================

Registration input must be:

{
    "name": "John Doe",
    "email": "john@example.com",
    "number": "03001234567",
    "password": "StrongPassword123!",
    "confirm_password": "StrongPassword123!"
}

Validate all fields before calling Supabase.

NAME VALIDATION

- Required.
- Must be a string.
- Trim leading/trailing whitespace.
- Minimum length: 2.
- Maximum length: 100.
- Reject empty value after trimming.
- Reject control characters.
- Do not blindly strip legitimate international/Unicode names.
- Store normalized name in Supabase user_metadata.

EMAIL VALIDATION

- Required.
- Use Pydantic EmailStr.
- Trim whitespace.
- Normalize to lowercase before sending to Supabase.
- Never trust frontend validation alone.

NUMBER VALIDATION

This is currently profile/contact information, NOT phone authentication.

- Required.
- Keep it as a string, never integer.
- Must contain exactly 11 digits.
- Regex equivalent:

^\d{11}$

Valid:
03001234567

Invalid:
3001234567
030012345678
0300-1234567
+923001234567
abc03001234

Do NOT send this value as the Supabase Auth `phone` field because we are not implementing phone authentication.

Store it inside user_metadata using a clear key such as:

{
    "name": "...",
    "phone_number": "03001234567"
}

PASSWORD VALIDATION

The backend must enforce the password rules.

Require:
- Minimum 8 characters.
- Maximum 128 characters.
- At least one uppercase letter.
- At least one lowercase letter.
- At least one digit.
- At least one special character.
- Reject leading/trailing whitespace mistakes where appropriate.
- Do not log the password.
- Do not return the password.
- Do not store the password ourselves.

CONFIRM PASSWORD

- Required.
- Must exactly equal password.
- confirm_password exists only for request validation.
- Never send confirm_password to Supabase.
- Never store confirm_password anywhere.

==================================================
REGISTRATION + EMAIL OTP FLOW
==================================================

Use Supabase email/password sign_up().

Registration flow:

Next.js
    ->
POST /api/v1/auth/register
    ->
FastAPI validates data
    ->
AuthService calls Supabase auth.sign_up()
    ->
Supabase creates an UNCONFIRMED Auth user
    ->
Supabase sends signup verification OTP email
    ->
API returns safe success response
    ->
User enters OTP
    ->
POST /api/v1/auth/verify-email
    ->
Supabase verify_otp()
    ->
User email becomes verified/confirmed
    ->
Account is now considered active/verified.

IMPORTANT:
Do not claim that the Supabase Auth user does not exist before OTP verification.
Supabase creates the unconfirmed Auth user during sign_up().
Our application considers registration complete only after successful email verification.

Use metadata when signing up:

options.data:
{
    "name": normalized_name,
    "phone_number": normalized_11_digit_number
}

Do not store password in metadata.

==================================================
OTP EMAIL REQUIREMENT
==================================================

We want an EMAIL OTP CODE, not just a confirmation link.

Document the required Supabase Dashboard configuration.

The Supabase Confirm Signup email template must show the OTP token so the user can manually enter it in the frontend.

The backend verify endpoint must accept:

{
    "email": "john@example.com",
    "otp": "123456"
}

Normalize email.

Trim OTP.

Validate OTP expected structure before sending it to Supabase.

Use the current Supabase Python SDK-supported signup email OTP verification type.

Do not use deprecated verification types.

==================================================
REGISTER ENDPOINT
==================================================

POST /api/v1/auth/register

Request:

{
    "name": "John Doe",
    "email": "john@example.com",
    "number": "03001234567",
    "password": "StrongPassword123!",
    "confirm_password": "StrongPassword123!"
}

Successful response should NOT expose Supabase session internals.

Example:

{
    "message": "Account registration started. Please verify the OTP sent to your email.",
    "email": "john@example.com",
    "email_verification_required": true
}

Use appropriate HTTP status.

Do not disclose unnecessary Supabase internal user information.

==================================================
VERIFY EMAIL OTP ENDPOINT
==================================================

POST /api/v1/auth/verify-email

Request:

{
    "email": "john@example.com",
    "otp": "123456"
}

Use Supabase:

auth.verify_otp(...)

Use the currently supported email verification type.

After successful verification:

- User must be confirmed.
- If Supabase returns a valid session, establish the authenticated session using our secure session strategy.
- Return controlled user information only.

Example response:

{
    "message": "Email verified successfully.",
    "user": {
        "id": "...",
        "email": "john@example.com",
        "name": "John Doe",
        "number": "03001234567"
    }
}

Never expose:
- refresh token in JSON
- access token in JSON if using HttpOnly cookie architecture
- password
- internal Supabase object dumps

==================================================
RESEND VERIFICATION OTP
==================================================

POST /api/v1/auth/resend-verification

Request:

{
    "email": "john@example.com"
}

Use Supabase resend signup confirmation functionality.

Return a generic response.

Avoid unnecessarily revealing whether an email is registered where practical.

Handle Supabase rate-limit errors safely.

==================================================
LOGIN
==================================================

POST /api/v1/auth/login

Request:

{
    "email": "john@example.com",
    "password": "StrongPassword123!"
}

Validation:
- valid email
- lowercase email
- password required
- never log password

Use:

supabase.auth.sign_in_with_password(...)

Authentication must use EMAIL + PASSWORD only.

If successful:
- obtain Supabase session
- securely store access token and refresh token using HttpOnly cookies
- return sanitized user information

Example response:

{
    "message": "Login successful.",
    "user": {
        "id": "...",
        "email": "john@example.com",
        "name": "John Doe",
        "number": "03001234567"
    }
}

For failed login, do not reveal whether email or password specifically was wrong.

Return a generic authentication failure such as:

"Invalid email or password."

==================================================
SESSION / COOKIE SECURITY
==================================================

Use backend-managed HttpOnly cookies.

Do NOT store Supabase tokens in localStorage.

Use two separate cookies:

access_token
refresh_token

Centralize cookie handling in cookies.py.

Development:
- secure may be false only for localhost HTTP development.

Production:
- secure=True
- httponly=True
- appropriate SameSite setting
- path="/"
- sensible max_age
- configurable cookie domain if required

Never log cookies or tokens.

Refresh token must never be returned in normal API JSON responses.

Access token should also remain in HttpOnly cookies for this architecture.

Use environment-specific cookie configuration.

If cookie-based state-changing authentication is used across sites/domains, implement an appropriate CSRF defense. Do not rely only on CORS as CSRF protection.

==================================================
CURRENT USER
==================================================

GET /api/v1/auth/me

Protected endpoint.

Use dependencies.py.

Read authentication session safely.

Validate the access token with Supabase server-side.

Do not trust unverified JWT payload data.

Return only sanitized user data:

{
    "id": "...",
    "email": "...",
    "name": "...",
    "number": "...",
    "email_verified": true
}

==================================================
REFRESH SESSION
==================================================

POST /api/v1/auth/refresh

Do not require the frontend to send refresh token in JSON if it is already stored in HttpOnly cookie.

Read refresh token from the secure refresh cookie.

Use:

supabase.auth.refresh_session(refresh_token)

IMPORTANT:
Supabase refresh tokens are rotated/single-use.
After successful refresh, replace BOTH cookies with the newly returned session values.

If refresh token is invalid:
- clear auth cookies
- return 401
- do not leak internal Supabase error details.

==================================================
LOGOUT
==================================================

POST /api/v1/auth/logout

Require authentication/session when appropriate.

Revoke/sign out the Supabase session.

Clear both:
- access_token cookie
- refresh_token cookie

Return:

{
    "message": "Logged out successfully."
}

Logout should remain safe/idempotent: stale local cookies should still be cleared even if remote session revocation fails.

==================================================
FORGOT PASSWORD
==================================================

POST /api/v1/auth/forgot-password

Request:

{
    "email": "john@example.com"
}

Use Supabase password recovery functionality.

Security requirement:
Do NOT reveal whether the email exists.

Always return something similar to:

{
    "message": "If an account exists for this email, password recovery instructions have been sent."
}

Do not return different responses for:
- existing email
- nonexistent email

This prevents user enumeration.

Configure the Supabase recovery email template for OTP if the project intends to use a manually entered recovery OTP.

==================================================
VERIFY PASSWORD RECOVERY OTP
==================================================

Create:

POST /api/v1/auth/verify-recovery-otp

Request:

{
    "email": "john@example.com",
    "otp": "123456"
}

Use Supabase verify_otp() with the correct recovery verification type.

On success:
- establish the temporary/recovery authenticated session securely.
- allow the user to proceed to password change.

Do not manually invent recovery tokens.

==================================================
CHANGE / RESET PASSWORD
==================================================

POST /api/v1/auth/change-password

This endpoint must require a valid authenticated/recovery session.

Request:

{
    "new_password": "NewStrongPassword123!",
    "confirm_new_password": "NewStrongPassword123!"
}

Apply the same password-strength validation as registration.

Require:
new_password == confirm_new_password

Never send confirm_new_password to Supabase.

Use Supabase authenticated:

auth.update_user({
    "password": new_password
})

After successful password change:
- return a safe success message.
- handle current sessions according to Supabase/session behavior.
- do not expose internal tokens.

==================================================
VALIDATION ARCHITECTURE
==================================================

schemas.py should contain:

RegisterRequest
RegisterResponse

VerifyEmailOtpRequest
VerifyEmailResponse

ResendVerificationRequest

LoginRequest
LoginResponse

ForgotPasswordRequest

VerifyRecoveryOtpRequest

ChangePasswordRequest

UserResponse

MessageResponse

Only add additional schemas when genuinely required.

Use Pydantic v2.

Use field validators/model validators appropriately.

Do not duplicate validation logic unnecessarily.

Extract reusable password validation if appropriate.

==================================================
ERROR HANDLING
==================================================

Implement centralized Auth error handling in:

app/modules/auth/errors.py

Do not copy a large generic try/except block into every endpoint.

Translate known Supabase Auth errors into controlled API errors.

Examples:

invalid input -> 422 where FastAPI/Pydantic handles it

invalid credentials -> 401

missing authentication -> 401

invalid/expired session -> 401

forbidden operation -> 403 when appropriate

duplicate/already registered account -> controlled 400/409 as appropriate

rate limiting -> 429

unexpected upstream/server error -> controlled 500/502/503 as appropriate

Never return:

str(exc)

directly to production clients for unknown exceptions.

Log internal errors server-side safely.

Never log:
- passwords
- confirm passwords
- OTP codes
- access tokens
- refresh tokens
- cookies
- Supabase secret credentials

==================================================
SECURITY REQUIREMENTS
==================================================

Apply defense in depth.

Request validation:
- validate every request body
- reject missing/incorrect types
- set reasonable string lengths
- normalize expected fields
- reject malformed input

Authentication:
- Supabase Auth only
- validate authenticated users server-side
- do not trust IDs/email/user data sent from the frontend as proof of identity

Authorization:
- current Auth module only needs authenticated-user protection where relevant
- future resources must verify ownership

Secrets:
- .env only
- never hard-code credentials
- never expose secret/service-role keys to frontend
- only use a secret/admin key if a future admin-only feature genuinely requires it

CORS:
- allow only configured frontend origins
- allow credentials when using cookies
- do not use wildcard origin with credentialed cookies

Cookies:
- HttpOnly
- Secure in production
- correct SameSite policy
- configurable domain
- appropriate lifetime

Errors:
- generic external errors
- detailed safe internal logging
- no stack traces returned to frontend

Rate limiting:
Apply rate limiting especially to:
- register
- verify OTP
- resend OTP
- login
- forgot password
- recovery OTP verification

Use an existing project-standard rate limiting solution if one already exists.
If none exists, add a minimal well-maintained FastAPI-compatible solution and document the added dependency.

Suggested stricter limits:
- login: per IP + identifier/email
- OTP verify: per IP + email
- resend OTP: per IP + email
- forgot password: per IP + email
- registration: per IP

Do not implement an insecure in-memory limiter pretending to provide production distributed protection without documenting its limitations.

Payload/security:
- add sensible request size controls if infrastructure supports it
- reject invalid content types where appropriate
- sanitize output
- do not render user-provided HTML

==================================================
SUPABASE CONFIGURATION
==================================================

Use backend environment variables such as:

APP_NAME=
APP_ENV=

FRONTEND_URL=
BACKEND_URL=

SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=

COOKIE_SECURE=
COOKIE_DOMAIN=

Do not require DATABASE_URL for Auth.

Validate required environment variables at startup.

Supabase Dashboard requirements must be documented in README or Auth setup documentation:

Authentication -> Providers -> Email
- Email provider enabled
- New user signup enabled
- Confirm Email enabled

Authentication -> Email Templates
- Configure Confirm Signup template to display OTP instead of relying only on a clickable link when our UI expects manual OTP entry.
- Configure Recovery template similarly if manual recovery OTP is required.

Authentication -> URL Configuration
- development and production URLs properly configured.

Do not change Supabase database schemas for this Auth module.

==================================================
SUPABASE CLIENT SECURITY
==================================================

Do not use one globally shared authenticated Supabase client whose user session can leak between FastAPI requests.

The backend serves multiple users concurrently.

Each authentication operation/session-sensitive operation must use an isolated Supabase client or another safe request-scoped approach.

Keep client construction centralized in:

app/integrations/supabase.py

==================================================
USER METADATA
==================================================

Store only:

{
    "name": "...",
    "phone_number": "..."
}

as user_metadata for this stage.

Do NOT store:
- password
- confirm_password
- OTP
- access token
- refresh token

Do not use user_metadata for trusted authorization roles/permissions in future.

==================================================
API ROUTES REQUIRED
==================================================

Final Auth routes should be:

POST /api/v1/auth/register

POST /api/v1/auth/verify-email

POST /api/v1/auth/resend-verification

POST /api/v1/auth/login

GET /api/v1/auth/me

POST /api/v1/auth/refresh

POST /api/v1/auth/logout

POST /api/v1/auth/forgot-password

POST /api/v1/auth/verify-recovery-otp

POST /api/v1/auth/change-password

Do not add unnecessary routes.

==================================================
TESTS
==================================================

Add proper tests without calling real Supabase in every unit test.

Mock the Supabase integration/service boundary where appropriate.

Test at minimum:

Registration:
- valid data
- email normalization
- name trimming
- exactly 11-digit number accepted
- number shorter than 11 rejected
- number longer than 11 rejected
- non-digit number rejected
- weak password rejected
- password mismatch rejected
- malformed email rejected

OTP:
- valid OTP path
- invalid OTP
- expired OTP
- malformed OTP
- resend verification path

Login:
- valid credentials
- invalid credentials
- unverified account behavior
- tokens are not returned in JSON when cookies are used

Current user:
- authenticated
- no session
- expired/invalid session

Refresh:
- valid refresh token
- rotated session cookies updated
- invalid refresh token clears cookies

Forgot password:
- response does not disclose whether account exists

Recovery:
- valid recovery OTP
- invalid/expired recovery OTP

Change password:
- valid authenticated/recovery session
- invalid session
- weak new password
- mismatch between new password and confirmation

Security:
- passwords never appear in response
- refresh token never appears in API response
- protected endpoints reject unauthenticated requests
- validation errors are controlled
- unexpected internal exceptions do not expose stack traces/secrets

==================================================
IMPLEMENTATION RULES
==================================================

Before changing code:

1. Inspect all existing backend Auth files.
2. Inspect current requirements.txt.
3. Inspect app/main.py and core/config.py.
4. Preserve existing working code unless a change is necessary.
5. Do not blindly overwrite architecture.
6. Do not create duplicate FastAPI app entry points.
7. Do not create a custom users table.
8. Do not add SQLAlchemy/Alembic/PostgreSQL dependencies for Auth.
9. Do not manually manage passwords or JWT signing.
10. Do not add unnecessary abstractions.

Use type hints.

Keep functions focused.

Avoid duplicate validation.

Avoid giant router functions.

Avoid giant service functions.

Follow PEP 8 and the project's Ruff configuration.

==================================================
DELIVERABLE
==================================================

Implement the complete Auth module.

After implementation, provide:

- exact files changed
- exact files created
- dependencies added/removed
- Supabase Dashboard settings I must configure manually
- environment variables required
- endpoint summary
- validation/security decisions
- commands to run formatting/lint/tests
- commands to start FastAPI
- any known limitations

Run or provide commands for:

ruff check .
pytest

and verify FastAPI starts without import/configuration errors.

Do not modify the Next.js frontend as part of this task.