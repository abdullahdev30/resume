import json
from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID

import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.config import settings
from app.integrations.s3_storage import S3StorageError
from app.main import app
from app.modules.auth.dependencies import get_auth_service
from app.modules.auth.errors import invalid_session_error
from app.modules.auth.router import limiter
from app.modules.auth.schemas import UserResponse
from app.modules.resume.models import Resume
from app.modules.resume.router import get_resume_service
from app.modules.resume.schemas import AIResumeDocument
from app.modules.resume.service import ResumeService

USER_A_ID = "550e8400-e29b-41d4-a716-446655440000"
USER_B_ID = "6b5d1f2c-6f2e-4a4a-9f6f-1a2b3c4d5e6f"
USER_A_TOKEN = "user-a-token"
USER_B_TOKEN = "user-b-token"
MISSING_RESUME_ID = "11111111-2222-3333-4444-555555555555"

PDF_BYTES = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n"
OTHER_PDF_BYTES = b"%PDF-1.7\nreplacement resume body\n%%EOF\n"


def ai_document(data: dict | None = None, template_id: int = 2) -> AIResumeDocument:
    return AIResumeDocument.model_validate(
        {
            "data": data or {"fullName": "John Doe", "skills": ["Python"]},
            "design": {
                "template_id": template_id,
                "primaryColor": "#2563eb",
                "secondaryColor": "#0f172a",
                "fontFamily": "Inter, sans-serif",
                "fontScale": 1.0,
                "lineSpacing": 1.4,
                "pageMargin": 18,
                "sectionOrder": [
                    "summary",
                    "experience",
                    "skills",
                    "education",
                ],
                "elementStyles": {},
            },
        }
    )


def user(user_id: str) -> UserResponse:
    return UserResponse(
        id=user_id,
        email="john@example.com",
        name="John Doe",
        number="03001234567",
        email_verified=True,
    )


@dataclass
class FakeAuthService:
    """Maps access tokens to users, mirroring AuthService.get_current_user."""

    def get_current_user(self, access_token: str) -> UserResponse:
        if access_token == USER_A_TOKEN:
            return user(USER_A_ID)
        if access_token == USER_B_TOKEN:
            return user(USER_B_ID)
        raise invalid_session_error()


class FakeResumeRepository:
    """In-memory stand-in for ResumeRepository, scoped by user id."""

    def __init__(self) -> None:
        self.rows: dict[str, Resume] = {}
        self.fail_on_create = False
        self.fail_on_update = False
        self.fail_on_delete = False
        self.cleanup_queue: list[dict] = []
        self._insert_seq: dict[str, int] = {}
        self._counter = 0

    def create(
        self,
        *,
        resume_id,
        user_id,
        title,
        file_name=None,
        storage_path=None,
        mime_type=None,
        file_size=None,
        template_id=None,
        data=None,
        resume_type="legacy_pdf",
        is_ai_generated=False,
    ) -> Resume:
        if self.fail_on_create:
            raise RuntimeError("database unavailable")
        now = datetime.now(timezone.utc)
        resume = Resume(
            id=resume_id,
            user_id=user_id,
            title=title,
            file_name=file_name,
            storage_path=storage_path,
            mime_type=mime_type,
            file_size=file_size,
            template_id=template_id,
            data=data,
            resume_type=resume_type,
            source_version=1,
            is_ai_generated=is_ai_generated,
            created_at=now,
            updated_at=now,
        )
        self._counter += 1
        self._insert_seq[resume_id] = self._counter
        self.rows[resume_id] = resume
        return resume

    def create_document(
        self,
        *,
        resume_id,
        user_id,
        title,
        template_id,
        data,
        resume_type,
        is_ai_generated,
    ) -> Resume:
        return self.create(
            resume_id=resume_id,
            user_id=user_id,
            title=title,
            template_id=template_id,
            data=data,
            resume_type=resume_type,
            is_ai_generated=is_ai_generated,
        )

    def get(self, user_id: str, resume_id: str) -> Resume | None:
        resume = self.rows.get(resume_id)
        if resume is None or resume.user_id != user_id:
            return None
        return resume

    def list(self, user_id: str) -> list[Resume]:
        # Mirrors the repository's newest-first ordering without depending on
        # clock resolution.
        rows = [resume for resume in self.rows.values() if resume.user_id == user_id]
        return sorted(rows, key=lambda r: self._insert_seq[r.id], reverse=True)

    def update(self, user_id: str, resume_id: str, values: dict) -> Resume | None:
        if self.fail_on_update:
            raise RuntimeError("database unavailable")
        resume = self.get(user_id, resume_id)
        if resume is None:
            return None
        for field, value in values.items():
            setattr(resume, field, value)
        resume.updated_at = datetime.now(timezone.utc)
        return resume

    def update_if_source_version(
        self,
        user_id: str,
        resume_id: str,
        expected_version: int,
        values: dict,
    ) -> Resume | None:
        resume = self.get(user_id, resume_id)
        if resume is None or resume.source_version != expected_version:
            return None
        return self.update(user_id, resume_id, values)

    def delete(self, user_id: str, resume_id: str) -> bool:
        if self.fail_on_delete:
            raise RuntimeError("database unavailable")
        resume = self.get(user_id, resume_id)
        if resume is None:
            return False
        del self.rows[resume_id]
        return True

    def enqueue_storage_cleanup(self, **values) -> None:
        self.cleanup_queue.append(values)


class FakeStorage:
    """In-memory stand-in for S3StorageService (no network access)."""

    def __init__(self) -> None:
        self.objects: dict[str, dict] = {}
        self.deleted: list[str] = []
        self.signed_paths: list[str] = []
        self.signed_names: list[str | None] = []
        self.fail_upload = False
        self.fail_delete = False

    async def upload_bytes(
        self,
        storage_path: str,
        data: bytes,
        content_type: str = "application/pdf",
    ) -> None:
        if self.fail_upload:
            raise S3StorageError("upload failed")
        self.objects[storage_path] = {
            "data": data,
            "content_type": content_type,
        }

    async def delete_object(self, storage_path: str) -> None:
        if self.fail_delete:
            raise S3StorageError("delete failed")
        self.deleted.append(storage_path)
        self.objects.pop(storage_path, None)

    def generate_signed_url(
        self,
        storage_path: str,
        expires_in: int | None = None,
        download_name: str | None = None,
    ) -> str:
        self.signed_paths.append(storage_path)
        self.signed_names.append(download_name)
        return (
            "https://storage.example.supabase.co/signed/"
            f"{storage_path}?token=test-signature"
        )

class FakeProfileDocument:
    def model_dump(self, mode="json"):
        return {
            "personal": {
                "first_name": "John",
                "last_name": "Doe",
                "email": "john@example.com",
                "professional_title": "Backend Engineer",
                "summary": "Builds reliable APIs.",
            },
            "experience": [],
            "education": [],
            "skills": [
                {"id": "skill-1", "name": "Python", "category": "Backend"},
                {"id": "skill-2", "name": "English", "category": "Language"},
            ],
            "projects": [],
            "certificates": [],
            "social_links": [],
        }


class FakeProfileService:
    def __init__(self) -> None:
        self.requested_user_ids: list[str] = []

    def get_profile(self, user_id: str):
        self.requested_user_ids.append(user_id)
        return FakeProfileDocument()


@dataclass
class Harness:
    repository: FakeResumeRepository
    storage: FakeStorage
    profile_service: FakeProfileService


@pytest.fixture(autouse=True)
def resume_overrides():
    limiter.enabled = False
    repository = FakeResumeRepository()
    storage = FakeStorage()
    profile_service = FakeProfileService()

    app.dependency_overrides[get_auth_service] = lambda: FakeAuthService()
    app.dependency_overrides[get_resume_service] = lambda: ResumeService(
        repository=repository,
        storage=storage,
        profile_service=profile_service,
    )
    yield Harness(
        repository=repository,
        storage=storage,
        profile_service=profile_service,
    )
    app.dependency_overrides.clear()
    limiter.enabled = True


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def authenticate(client: TestClient, token: str = USER_A_TOKEN) -> None:
    client.cookies.set("access_token", token)


def create_resume(
    client: TestClient,
    *,
    token: str = USER_A_TOKEN,
    filename: str = "resume.pdf",
    content: bytes = PDF_BYTES,
    content_type: str = "application/pdf",
    title: str | None = "Senior Backend Engineer Resume",
):
    authenticate(client, token)
    data = {} if title is None else {"title": title}
    return client.post(
        "/api/v1/resumes",
        files={"file": (filename, content, content_type)},
        data=data,
    )


def error_code(response) -> str:
    return response.json()["detail"]["code"]


def test_create_resume_requires_authentication(client):
    response = client.post(
        "/api/v1/resumes",
        files={"file": ("resume.pdf", PDF_BYTES, "application/pdf")},
    )

    assert response.status_code == 401


def test_create_resume_uploads_pdf_and_stores_metadata(client, resume_overrides):
    response = create_resume(client)
    body = response.json()

    assert response.status_code == 201
    assert body["id"] == str(UUID(body["id"]))
    assert body["title"] == "Senior Backend Engineer Resume"
    assert body["file_name"] == "resume.pdf"
    assert body["file_size"] == len(PDF_BYTES)
    assert body["mime_type"] == "application/pdf"
    assert body["download_url"]

    storage_path = f"{USER_A_ID}/resumes/{body['id']}.pdf"
    assert storage_path in resume_overrides.storage.objects
    stored = resume_overrides.storage.objects[storage_path]
    assert stored["data"] == PDF_BYTES
    assert stored["content_type"] == "application/pdf"

    row = resume_overrides.repository.rows[body["id"]]
    assert row.user_id == USER_A_ID
    assert row.storage_path == storage_path
    assert row.file_name == "resume.pdf"
    assert row.mime_type == "application/pdf"
    assert row.file_size == len(PDF_BYTES)


def test_create_resume_ignores_client_supplied_user_id(client, resume_overrides):
    authenticate(client)
    response = client.post(
        "/api/v1/resumes",
        files={"file": ("resume.pdf", PDF_BYTES, "application/pdf")},
        data={"title": "Resume", "user_id": USER_B_ID},
    )

    assert response.status_code == 201
    row = resume_overrides.repository.rows[response.json()["id"]]
    assert row.user_id == USER_A_ID


def test_create_resume_defaults_title_from_file_name(client):
    response = create_resume(client, title=None)

    assert response.status_code == 201
    assert response.json()["title"] == "resume"


def test_create_resume_ignores_path_traversal_in_file_name(client, resume_overrides):
    response = create_resume(client, filename="../../etc/passwd.pdf")
    body = response.json()

    assert response.status_code == 201
    assert body["file_name"] == "passwd.pdf"
    assert f"{USER_A_ID}/resumes/{body['id']}.pdf" in resume_overrides.storage.objects


def test_create_resume_rejects_non_pdf_extension(client, resume_overrides):
    response = create_resume(client, filename="resume.txt")

    assert response.status_code == 422
    assert error_code(response) == "invalid_resume_file"
    assert resume_overrides.storage.objects == {}


def test_create_resume_rejects_spoofed_content_type(client, resume_overrides):
    response = create_resume(client, content_type="text/plain")

    assert response.status_code == 422
    assert error_code(response) == "invalid_resume_file"
    assert resume_overrides.storage.objects == {}


def test_create_resume_rejects_invalid_pdf_signature(client, resume_overrides):
    response = create_resume(client, content=b"this is definitely not a pdf")

    assert response.status_code == 422
    assert error_code(response) == "invalid_resume_file"
    assert resume_overrides.storage.objects == {}
    assert resume_overrides.repository.rows == {}


def test_create_resume_rejects_oversized_file(client, resume_overrides, monkeypatch):
    monkeypatch.setattr(settings, "resume_max_file_size_bytes", 64)

    response = create_resume(client, content=b"%PDF-" + b"x" * 200)

    assert response.status_code == 413
    assert error_code(response) == "resume_file_too_large"
    assert resume_overrides.storage.objects == {}
    assert resume_overrides.repository.rows == {}


def test_create_resume_removes_storage_object_when_persistence_fails(
    client, resume_overrides
):
    resume_overrides.repository.fail_on_create = True

    response = create_resume(client)

    assert response.status_code == 500
    assert error_code(response) == "resume_persistence_error"
    assert resume_overrides.storage.objects == {}
    assert len(resume_overrides.storage.deleted) == 1


def test_create_resume_reports_storage_failure(client, resume_overrides):
    resume_overrides.storage.fail_upload = True

    response = create_resume(client)

    assert response.status_code == 502
    assert error_code(response) == "resume_storage_error"
    assert resume_overrides.repository.rows == {}


def test_create_template_resume_stores_only_editable_source(
    client, resume_overrides
):
    authenticate(client)
    payload = {
        "title": "Template Resume",
        "template_id": "1",
        "resume_data": {
            "fullName": "John Doe",
            "jobTitle": "Backend Engineer",
            "email": "john@example.com",
            "skills": ["Python", "FastAPI"],
            "experience": [],
            "education": [],
        },
    }

    response = client.post("/api/v1/resumes/template", json=payload)
    body = response.json()

    assert response.status_code == 201
    assert body["resume_type"] == "template"
    assert body["editable"] is True
    assert body["template_id"] == "1"
    assert body["resume_data"]["fullName"] == "John Doe"
    assert "html_content" not in body
    assert body["file_name"] is None
    assert body["file_size"] is None
    assert body["mime_type"] is None
    assert body["download_url"] is None
    assert resume_overrides.storage.objects == {}
    assert resume_overrides.storage.signed_paths == []

    row = resume_overrides.repository.rows[body["id"]]
    assert row.storage_path is None
    assert row.data["fullName"] == "John Doe"


@pytest.mark.parametrize("template_id", ["1", "2", "3", "4", "5", "6"])
def test_all_catalog_template_ids_create_real_resumes(client, template_id):
    authenticate(client)
    response = client.post(
        "/api/v1/resumes/template",
        json={
            "title": f"Template {template_id}",
            "template_id": template_id,
            "resume_data": {"fullName": "John Doe"},
        },
    )

    assert response.status_code == 201
    assert response.json()["template_id"] == template_id


def test_template_creation_rejects_unknown_template_id(client):
    authenticate(client)
    response = client.post(
        "/api/v1/resumes/template",
        json={
            "title": "Unknown template",
            "template_id": "999",
            "resume_data": {"fullName": "John Doe"},
        },
    )

    assert response.status_code == 422


def test_create_ai_resume_requires_server_api_key(
    client, resume_overrides, monkeypatch
):
    monkeypatch.setattr(settings, "ai_api_key", None)
    authenticate(client)

    response = client.post(
        "/api/v1/resumes/ai",
        json={
            "title": "AI Resume",
            "prompt": "Target backend engineering roles using only my existing data.",
        },
    )

    assert response.status_code == 503
    assert error_code(response) == "AI_NOT_CONFIGURED"
    assert resume_overrides.repository.rows == {}


def test_create_ai_resume_uses_backend_profile_and_persists_validated_draft(
    client,
    resume_overrides,
    monkeypatch,
):
    monkeypatch.setattr(settings, "ai_api_key", "server-secret")
    captured = {}

    async def fake_generate(self, **kwargs):
        captured.update(kwargs)
        return ai_document(
            {
                "fullName": "John Doe",
                "jobTitle": "Backend Engineer",
                "email": "john@example.com",
                "skills": ["Python"],
            },
            template_id=4,
        )

    monkeypatch.setattr(ResumeService, "_generate_with_ai_provider", fake_generate)
    authenticate(client)
    response = client.post(
        "/api/v1/resumes/ai",
        json={
            "title": "AI Resume",
            "prompt": "Focus on backend roles.",
            "selected_sections": ["personal", "skills"],
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["template_id"] == "4"
    assert body["resume_type"] == "ai"
    assert body["resume_data"]["fullName"] == "John Doe"
    assert captured["profile_context"]["personal"]["first_name"] == "John"
    assert "summary" not in captured["profile_context"]["personal"]
    assert captured["profile_context"]["skills"][0]["name"] == "Python"
    assert len(captured["profile_context"]["skills"]) == 1
    assert resume_overrides.profile_service.requested_user_ids == [USER_A_ID]


def test_create_ai_resume_rejects_client_supplied_profile_context(client, monkeypatch):
    monkeypatch.setattr(settings, "ai_api_key", "server-secret")
    authenticate(client)
    response = client.post(
        "/api/v1/resumes/ai",
        json={
            "title": "AI Resume",
            "prompt": "Use this fake identity.",
            "profile_context": {"fullName": "Another User"},
        },
    )

    assert response.status_code == 422


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("template_id", 7),
        ("primaryColor", "blue"),
        ("fontFamily", "Comic Sans MS"),
        ("fontScale", 4),
        ("lineSpacing", 5),
        ("pageMargin", 100),
    ],
)
def test_ai_design_rejects_unsafe_values(field, value):
    payload = ai_document().model_dump(mode="json", by_alias=True)
    payload["design"][field] = value

    with pytest.raises(ValidationError):
        AIResumeDocument.model_validate(payload)


@pytest.mark.parametrize(
    ("provider_error", "expected_status", "expected_code"),
    [
        (httpx.ReadTimeout("provider timeout"), 504, "AI_TIMEOUT"),
        (
            httpx.HTTPStatusError(
                "provider throttled",
                request=httpx.Request("POST", "https://api.example.test/responses"),
                response=httpx.Response(
                    429,
                    request=httpx.Request("POST", "https://api.example.test/responses"),
                ),
            ),
            429,
            "RATE_LIMITED",
        ),
    ],
)
def test_ai_provider_errors_have_clear_status_codes(
    client,
    monkeypatch,
    provider_error,
    expected_status,
    expected_code,
):
    monkeypatch.setattr(settings, "ai_api_key", "server-secret")

    async def fail_generation(self, **kwargs):
        raise provider_error

    monkeypatch.setattr(ResumeService, "_generate_with_ai_provider", fail_generation)
    authenticate(client)
    response = client.post(
        "/api/v1/resumes/ai",
        json={"title": "AI Resume", "prompt": "Focus on backend roles."},
    )

    assert response.status_code == expected_status
    assert error_code(response) == expected_code


@pytest.mark.asyncio
async def test_ai_provider_retries_invalid_structured_output_once(
    resume_overrides,
    monkeypatch,
):
    monkeypatch.setattr(settings, "ai_api_key", "server-secret")
    monkeypatch.setattr(settings, "ai_provider", "openai")

    class FakeResponse:
        def __init__(self, output_text: str) -> None:
            self.output_text = output_text

        def raise_for_status(self) -> None:
            return None

        status_code = 200

        @property
        def text(self) -> str:
            return self.output_text

        def json(self) -> dict:
            return {"output_text": self.output_text}

    class FakeAsyncClient:
        calls = 0

        def __init__(self, **kwargs) -> None:
            self.kwargs = kwargs

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, traceback):
            return False

        async def post(self, *args, **kwargs):
            self.calls += 1
            if self.calls == 1:
                return FakeResponse("not valid json")
            return FakeResponse(json.dumps(ai_document().model_dump(mode="json", by_alias=True)))

    fake_client = FakeAsyncClient()
    monkeypatch.setattr(
        "app.modules.resume.service.httpx.AsyncClient",
        lambda **kwargs: fake_client,
    )
    service = ResumeService(
        repository=resume_overrides.repository,
        storage=resume_overrides.storage,
        profile_service=resume_overrides.profile_service,
    )

    result = await service._generate_with_ai_provider(
        prompt="Focus on backend work.",
        job_description=None,
        profile_context=FakeProfileDocument().model_dump(),
        reference_links=[],
        existing_data=None,
    )

    assert fake_client.calls == 2
    assert result.data.full_name == "John Doe"
    assert result.data.skills == ["Python"]


def test_ai_strict_schema_removes_defaults_and_arbitrary_maps():
    schema = ResumeService._strict_json_schema(
        AIResumeDocument.model_json_schema(by_alias=True)
    )

    resume_data = schema["$defs"]["ResumeData"]
    assert "default" not in resume_data["properties"]["fullName"]
    element_styles = resume_data["properties"]["elementStyles"]
    assert element_styles["properties"] == {}
    assert element_styles["required"] == []
    assert element_styles["additionalProperties"] is False


def test_list_resumes_requires_authentication(client):
    response = client.get("/api/v1/resumes")

    assert response.status_code == 401


def test_list_resumes_only_returns_own_resumes(client):
    first = create_resume(client, title="First resume").json()
    second = create_resume(client, title="Second resume").json()
    create_resume(client, token=USER_B_TOKEN, title="Other user resume")

    authenticate(client)
    response = client.get("/api/v1/resumes")

    assert response.status_code == 200
    body = response.json()
    assert [item["id"] for item in body["resumes"]] == [second["id"], first["id"]]
    assert all(item["download_url"] for item in body["resumes"])


def test_list_resumes_is_scoped_per_user(client):
    create_resume(client, title="User A resume")
    other = create_resume(
        client,
        token=USER_B_TOKEN,
        title="User B resume",
    ).json()

    response = client.get("/api/v1/resumes")

    assert response.status_code == 200
    resumes = response.json()["resumes"]
    assert len(resumes) == 1
    assert resumes[0]["id"] == other["id"]


def test_get_resume_returns_signed_download_url(client, resume_overrides):
    created = create_resume(client).json()

    response = client.get(f"/api/v1/resumes/{created['id']}")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == created["id"]
    assert body["title"] == created["title"]
    assert body["download_url"].startswith(
        "https://storage.example.supabase.co/signed/"
    )
    assert f"{USER_A_ID}/resumes/{created['id']}.pdf" in (
        resume_overrides.storage.signed_paths
    )


def test_pdf_endpoint_signs_only_an_owned_legacy_upload(client, resume_overrides):
    created = create_resume(client).json()

    response = client.get(f"/api/v1/resumes/{created['id']}/pdf")

    assert response.status_code == 200
    assert response.json()["download_url"].startswith(
        "https://storage.example.supabase.co/signed/"
    )

    authenticate(client, USER_B_TOKEN)
    denied = client.get(f"/api/v1/resumes/{created['id']}/pdf")
    assert denied.status_code == 404
    assert error_code(denied) == "resume_not_found"


def test_editable_resume_has_no_signed_url_or_server_pdf_routes(
    client, resume_overrides
):
    authenticate(client)
    created = client.post(
        "/api/v1/resumes/template",
        json={
            "title": "Browser PDF",
            "template_id": "2",
            "resume_data": {"fullName": "John Doe"},
        },
    ).json()

    assert created["download_url"] is None
    assert resume_overrides.storage.objects == {}
    assert resume_overrides.storage.signed_paths == []

    pdf_response = client.get(f"/api/v1/resumes/{created['id']}/pdf")
    assert pdf_response.status_code == 409
    assert error_code(pdf_response) == "resume_pdf_unavailable"

    assert client.post(
        f"/api/v1/resumes/{created['id']}/generate-pdf"
    ).status_code in {404, 405}
    assert client.get(
        f"/api/v1/resumes/{created['id']}/print-data"
    ).status_code == 404


def test_get_resume_returns_not_found_for_unknown_id(client):
    authenticate(client)
    response = client.get(f"/api/v1/resumes/{MISSING_RESUME_ID}")

    assert response.status_code == 404
    assert error_code(response) == "resume_not_found"


def test_get_resume_rejects_invalid_id(client):
    authenticate(client)
    response = client.get("/api/v1/resumes/not-a-uuid")

    assert response.status_code == 422


def test_get_resume_of_another_user_is_not_found(client):
    created = create_resume(client).json()

    authenticate(client, USER_B_TOKEN)
    response = client.get(f"/api/v1/resumes/{created['id']}")

    assert response.status_code == 404
    assert error_code(response) == "resume_not_found"


def test_get_resume_requires_authentication(client, resume_overrides):
    created = create_resume(client).json()
    client.cookies.clear()

    response = client.get(f"/api/v1/resumes/{created['id']}")

    assert response.status_code == 401


def test_update_resume_title_only(client, resume_overrides):
    created = create_resume(client).json()
    storage_path = f"{USER_A_ID}/resumes/{created['id']}.pdf"

    response = client.put(
        f"/api/v1/resumes/{created['id']}",
        data={"title": "Updated title"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Updated title"
    assert body["file_size"] == len(PDF_BYTES)
    # No PDF replacement, so the stored object is untouched.
    assert resume_overrides.storage.objects[storage_path]["data"] == PDF_BYTES
    assert len(resume_overrides.storage.objects) == 1


def test_update_resume_replaces_pdf_only(client, resume_overrides):
    created = create_resume(client).json()
    storage_path = f"{USER_A_ID}/resumes/{created['id']}.pdf"

    response = client.put(
        f"/api/v1/resumes/{created['id']}",
        files={"file": ("updated.pdf", OTHER_PDF_BYTES, "application/pdf")},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == created["title"]
    assert body["file_name"] == "updated.pdf"
    assert body["file_size"] == len(OTHER_PDF_BYTES)
    # The storage path stays stable while the bytes are replaced.
    assert list(resume_overrides.storage.objects) == [storage_path]
    assert resume_overrides.storage.objects[storage_path]["data"] == OTHER_PDF_BYTES


def test_update_resume_replaces_pdf_and_title(client, resume_overrides):
    created = create_resume(client).json()

    response = client.put(
        f"/api/v1/resumes/{created['id']}",
        files={"file": ("updated.pdf", OTHER_PDF_BYTES, "application/pdf")},
        data={"title": "Replaced resume"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Replaced resume"
    assert body["file_name"] == "updated.pdf"
    assert body["file_size"] == len(OTHER_PDF_BYTES)


def test_update_resume_requires_a_change(client, resume_overrides):
    created = create_resume(client).json()

    response = client.put(f"/api/v1/resumes/{created['id']}")

    assert response.status_code == 422
    assert error_code(response) == "resume_update_error"


def test_update_template_resume_accepts_json_source_changes(client, resume_overrides):
    authenticate(client)
    created = client.post(
        "/api/v1/resumes/template",
        json={
            "title": "Template Resume",
            "template_id": "1",
            "resume_data": {"fullName": "John Doe", "skills": []},
        },
    ).json()
    response = client.put(
        f"/api/v1/resumes/{created['id']}",
        json={
            "title": "Updated Template",
            "template_id": "2",
            "resume_data": {"fullName": "John Updated", "skills": ["Python"]},
            "source_version": created["source_version"],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Updated Template"
    assert body["template_id"] == "2"
    assert body["resume_data"]["fullName"] == "John Updated"
    assert body["source_version"] == 2
    assert body["file_name"] is None
    assert body["download_url"] is None
    assert resume_overrides.storage.objects == {}
    assert resume_overrides.storage.signed_paths == []


def test_ai_edit_returns_proposal_without_saving(client, resume_overrides, monkeypatch):
    monkeypatch.setattr(settings, "ai_api_key", "server-secret")

    async def fake_generate(self, **kwargs):
        existing = dict(kwargs["existing_data"])
        existing["summary"] = "Backend systems specialist."
        return ai_document(existing, template_id=3)

    monkeypatch.setattr(ResumeService, "_generate_with_ai_provider", fake_generate)
    authenticate(client)
    created = client.post(
        "/api/v1/resumes/template",
        json={
            "title": "Template Resume",
            "template_id": "1",
            "resume_data": {"fullName": "John Doe", "skills": []},
        },
    ).json()

    response = client.post(
        f"/api/v1/resumes/{created['id']}/ai-edit",
        json={"instruction": "Make the summary target backend roles."},
    )

    assert response.status_code == 200
    proposal = response.json()
    assert proposal["resume_data"]["fullName"] == "John Doe"
    assert "backend" in proposal["resume_data"]["summary"].lower()
    assert proposal["template_id"] == "3"

    stored = resume_overrides.repository.rows[created["id"]]
    assert stored.data["fullName"] == "John Doe"
    assert stored.data.get("summary") == ""


def test_update_rejects_stale_source_version_without_overwriting(client):
    authenticate(client)
    created = client.post(
        "/api/v1/resumes/template",
        json={"title": "Shared", "template_id": "1", "resume_data": {"fullName": "Original"}},
    ).json()

    first = client.put(
        f"/api/v1/resumes/{created['id']}",
        json={
            "resume_data": {"fullName": "First tab"},
            "source_version": created["source_version"],
        },
    )
    second = client.put(
        f"/api/v1/resumes/{created['id']}",
        json={
            "resume_data": {"fullName": "Second tab"},
            "source_version": created["source_version"],
        },
    )

    assert first.status_code == 200
    assert second.status_code == 409
    assert error_code(second) == "resume_version_conflict"
    current = client.get(f"/api/v1/resumes/{created['id']}").json()
    assert current["resume_data"]["fullName"] == "First tab"


def test_legacy_pdf_cannot_be_ai_edited(client):
    created = create_resume(client).json()

    response = client.post(
        f"/api/v1/resumes/{created['id']}/ai-edit",
        json={"instruction": "Rewrite this resume."},
    )

    assert response.status_code == 409
    assert error_code(response) == "resume_not_editable"


def test_update_resume_rejects_invalid_pdf(client, resume_overrides):
    created = create_resume(client).json()
    storage_path = f"{USER_A_ID}/resumes/{created['id']}.pdf"

    response = client.put(
        f"/api/v1/resumes/{created['id']}",
        files={"file": ("updated.pdf", b"broken pdf body", "application/pdf")},
    )

    assert response.status_code == 422
    assert error_code(response) == "invalid_resume_file"
    # The previously stored PDF must survive a rejected upload.
    assert resume_overrides.storage.objects[storage_path]["data"] == PDF_BYTES


def test_update_resume_of_another_user_is_not_found(client, resume_overrides):
    created = create_resume(client).json()
    storage_path = f"{USER_A_ID}/resumes/{created['id']}.pdf"

    authenticate(client, USER_B_TOKEN)
    response = client.put(
        f"/api/v1/resumes/{created['id']}",
        files={"file": ("updated.pdf", OTHER_PDF_BYTES, "application/pdf")},
        data={"title": "Hijacked"},
    )

    assert response.status_code == 404
    assert error_code(response) == "resume_not_found"
    assert resume_overrides.repository.rows[created["id"]].title == created["title"]
    assert resume_overrides.storage.objects[storage_path]["data"] == PDF_BYTES


def test_update_resume_returns_not_found_for_unknown_id(client):
    authenticate(client)
    response = client.put(
        f"/api/v1/resumes/{MISSING_RESUME_ID}",
        data={"title": "Updated title"},
    )

    assert response.status_code == 404
    assert error_code(response) == "resume_not_found"


def test_update_resume_reports_storage_failure(client, resume_overrides):
    created = create_resume(client).json()
    resume_overrides.storage.fail_upload = True

    response = client.put(
        f"/api/v1/resumes/{created['id']}",
        files={"file": ("updated.pdf", OTHER_PDF_BYTES, "application/pdf")},
    )

    assert response.status_code == 502
    assert error_code(response) == "resume_storage_error"


def test_delete_resume_removes_storage_object_and_record(client, resume_overrides):
    created = create_resume(client).json()
    storage_path = f"{USER_A_ID}/resumes/{created['id']}.pdf"
    assert storage_path in resume_overrides.storage.objects

    delete_object = resume_overrides.storage.delete_object

    async def assert_row_deleted_before_storage(storage_key: str) -> None:
        assert created["id"] not in resume_overrides.repository.rows
        await delete_object(storage_key)

    resume_overrides.storage.delete_object = assert_row_deleted_before_storage

    response = client.delete(f"/api/v1/resumes/{created['id']}")

    assert response.status_code == 200
    assert response.json() == {"message": "Resume deleted successfully."}
    assert storage_path in resume_overrides.storage.deleted
    assert resume_overrides.storage.objects == {}
    assert created["id"] not in resume_overrides.repository.rows


def test_delete_resume_of_another_user_is_not_found(client, resume_overrides):
    created = create_resume(client).json()
    storage_path = f"{USER_A_ID}/resumes/{created['id']}.pdf"

    authenticate(client, USER_B_TOKEN)
    response = client.delete(f"/api/v1/resumes/{created['id']}")

    assert response.status_code == 404
    assert error_code(response) == "resume_not_found"
    assert storage_path in resume_overrides.storage.objects
    assert created["id"] in resume_overrides.repository.rows


def test_delete_resume_returns_not_found_for_unknown_id(client):
    authenticate(client)
    response = client.delete(f"/api/v1/resumes/{MISSING_RESUME_ID}")

    assert response.status_code == 404
    assert error_code(response) == "resume_not_found"


def test_delete_resume_requires_authentication(client, resume_overrides):
    created = create_resume(client).json()
    client.cookies.clear()

    response = client.delete(f"/api/v1/resumes/{created['id']}")

    assert response.status_code == 401


def test_delete_resume_succeeds_and_enqueues_cleanup_when_storage_delete_fails(client, resume_overrides):
    created = create_resume(client).json()
    resume_overrides.storage.fail_delete = True

    response = client.delete(f"/api/v1/resumes/{created['id']}")

    assert response.status_code == 200
    assert created["id"] not in resume_overrides.repository.rows
    assert resume_overrides.storage.deleted == []
    assert resume_overrides.repository.cleanup_queue[0]["storage_path"].endswith(
        f"{created['id']}.pdf"
    )


def test_delete_editable_resume_removes_only_database_source(client, resume_overrides):
    authenticate(client)
    created = client.post(
        "/api/v1/resumes/template",
        json={
            "title": "Editable",
            "template_id": "1",
            "resume_data": {"fullName": "John Doe"},
        },
    ).json()

    response = client.delete(f"/api/v1/resumes/{created['id']}")

    assert response.status_code == 200
    assert created["id"] not in resume_overrides.repository.rows
    assert resume_overrides.storage.objects == {}
    assert resume_overrides.storage.deleted == []
    assert resume_overrides.repository.cleanup_queue == []


def test_delete_resume_reports_database_failure(client, resume_overrides):
    created = create_resume(client).json()
    resume_overrides.repository.fail_on_delete = True

    response = client.delete(f"/api/v1/resumes/{created['id']}")

    assert response.status_code == 500
    assert error_code(response) == "resume_persistence_error"


def test_resume_response_never_exposes_internal_paths_or_secrets(client):
    created = create_resume(client)

    body = created.text.lower()
    # No raw storage field, no credentials, no permanent public object URL.
    assert "storage_path" not in body
    assert "secret" not in body
    assert "access_key" not in body
    assert "amazonaws.com" not in body
