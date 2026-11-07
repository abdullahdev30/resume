"""Isolated browser-test backend: real auth routes/cookies, fake provider only.

Never run this as the application server. No database or external email is used.
"""

import base64

from fastapi import FastAPI
from fastapi.responses import Response

from app.core.config import settings
from app.modules.auth.dependencies import get_auth_service
from app.modules.auth.errors import AuthApplicationError, invalid_recovery_code_error
from app.modules.auth.router import limiter, router
from app.modules.persona.router import get_persona_service
from app.modules.persona.router import router as persona_router
from app.modules.persona.service import PersonaService
from app.modules.resume.router import get_resume_service
from app.modules.resume.router import router as resume_router
from app.modules.resume.schemas import AIResumeDocument
from app.modules.resume.service import ResumeService
from tests.auth.test_auth import FakeAuthService, auth_result
from tests.persona.test_persona import MemoryPersonaRepository, MemoryStorage
from tests.resume.test_resume import FakeResumeRepository, FakeStorage

# Isolated browser fixtures have no PostgreSQL connection. Real production
# account/expiry checks remain in billing dependencies and are tested separately.
from app.modules.billing import service as billing_service
from app.modules.billing import dependencies as billing_dependencies
from app.modules.billing.router import router as billing_router
from app.modules.billing import router as billing_routes

billing_service.access_for = lambda _: {'role': 'user', 'active': True}
billing_dependencies.access_for = billing_service.access_for
billing_service.subscription_for = lambda _: {'status': 'active', 'subscription': None, 'persona_count': 0}
billing_dependencies.subscription_for = billing_service.subscription_for
billing_routes.access_for = billing_service.access_for
billing_routes.subscription_for = billing_service.subscription_for


class BrowserAuthService(FakeAuthService):
    recovery_used = False

    def login(self, payload):
        if payload.email == "offline@example.com":
            raise AuthApplicationError(
                503,
                "auth_provider_error",
                "Authentication service is temporarily unavailable.",
            )
        if payload.email == "unverified@example.com":
            raise AuthApplicationError(
                403,
                "email_not_confirmed",
                "Please verify your email before signing in.",
            )
        if payload.password != "Password123!":
            raise AuthApplicationError(
                401, "authentication_failed", "Invalid email or password."
            )
        return auth_result()

    def verify_email(self, payload):
        if payload.otp != "123456":
            raise AuthApplicationError(
                401, "authentication_failed", "Invalid or expired OTP."
            )
        return auth_result()

    def forgot_password(self, payload):
        self.recovery_used = False

    def verify_recovery_otp(self, payload):
        self.verify_email(payload)
        return "browser-test-recovery-code"

    def change_password(self, *, payload, access_token=None, refresh_token=None):
        if payload.recovery_code:
            if (
                payload.recovery_code != "browser-test-recovery-code"
                or self.recovery_used
            ):
                raise invalid_recovery_code_error()
            self.recovery_used = True
        return super().change_password(
            payload=payload, access_token=access_token, refresh_token=refresh_token
        )


app = FastAPI()
service = BrowserAuthService()
app.dependency_overrides[get_auth_service] = lambda: service
limiter.enabled = False
app.include_router(router, prefix="/api/v1")
app.include_router(billing_router, prefix="/api/v1")


class BrowserStorage(MemoryStorage):
    def generate_signed_url(self, path):
        data, content_type = self.files[path]
        return f"data:{content_type};base64,{base64.b64encode(data).decode()}"


persona_service = PersonaService(MemoryPersonaRepository(), BrowserStorage())
app.dependency_overrides[get_persona_service] = lambda: persona_service
app.include_router(persona_router, prefix="/api/v1")


class BrowserPdfStorage(FakeStorage):
    def generate_signed_url(self, storage_path, expires_in=None, download_name=None):
        return "/api/v1/test-pdfs/" + storage_path


class BrowserResumeService(ResumeService):
    def _profile_context(self, user_id, selected_sections=None, persona_id=None):
        # Actual persona service still performs ownership checks in this fixture.
        return persona_service.get(user_id, persona_id).data

    async def _generate_with_ai_provider(self, **kwargs):
        personal = kwargs["profile_context"]["personal"]
        return AIResumeDocument.model_validate(
            {
                "data": {
                    "fullName": " ".join(
                        filter(
                            None,
                            [personal.get("first_name"), personal.get("last_name")],
                        )
                    ),
                    "email": personal.get("email") or "",
                    "summary": personal.get("summary") or "",
                },
                "design": {
                    "template_id": 2,
                    "primaryColor": "#2563eb",
                    "secondaryColor": "#0f172a",
                    "fontFamily": "Georgia, serif",
                    "fontScale": 1,
                    "lineSpacing": 1.15,
                    "pageMargin": 10,
                    "sectionOrder": ["summary", "experience", "education", "skills"],
                },
            }
        )


settings.ai_api_key = "isolated-test-provider"
pdf_storage = BrowserPdfStorage()
resume_service = BrowserResumeService(FakeResumeRepository(), pdf_storage)
app.dependency_overrides[get_resume_service] = lambda: resume_service
app.include_router(resume_router, prefix="/api/v1")


@app.get("/api/v1/test-pdfs/{key:path}")
def test_pdf(key: str):
    item = pdf_storage.objects[key]
    return Response(
        item["data"],
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="resume.pdf"'},
    )


@app.get("/health")
def health():
    return {"status": "ok"}
