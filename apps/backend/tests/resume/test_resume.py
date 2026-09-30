from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.integrations.s3_storage import S3StorageError
from app.main import app
from app.modules.auth.dependencies import get_auth_service
from app.modules.auth.errors import invalid_session_error
from app.modules.auth.router import limiter
from app.modules.auth.schemas import UserResponse
from app.modules.resume.models import Resume
from app.modules.resume.router import get_resume_service
from app.modules.resume.service import ResumeService

USER_A_ID = "550e8400-e29b-41d4-a716-446655440000"
USER_B_ID = "6b5d1f2c-6f2e-4a4a-9f6f-1a2b3c4d5e6f"
USER_A_TOKEN = "user-a-token"
USER_B_TOKEN = "user-b-token"
MISSING_RESUME_ID = "11111111-2222-3333-4444-555555555555"

PDF_BYTES = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n"
OTHER_PDF_BYTES = b"%PDF-1.7\nreplacement resume body\n%%EOF\n"


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
        self._insert_seq: dict[str, int] = {}
        self._counter = 0

    def create(
        self,
        *,
        resume_id,
        user_id,
        title,
        file_name,
        storage_path,
        mime_type,
        file_size,
        template_id=None,
        data=None,
        html_content=None,
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
            html_content=html_content,
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
        html_content,
        storage_path,
        file_name,
        file_size,
        resume_type,
        is_ai_generated,
    ) -> Resume:
        return self.create(
            resume_id=resume_id,
            user_id=user_id,
            title=title,
            file_name=file_name,
            storage_path=storage_path,
            mime_type="application/pdf",
            file_size=file_size,
            template_id=template_id,
            data=data,
            html_content=html_content,
            resume_type=resume_type,
            is_ai_generated=is_ai_generated,
        )

    def get(self, user_id: str, resume_id: str) -> Resume | None:
        resume = self.rows.get(resume_id)
        if (
            resume is None
            or resume.user_id != user_id
            or resume.storage_path is None
        ):
            return None
        return resume

    def list(self, user_id: str) -> list[Resume]:
        # Mirrors the repository's newest-first ordering without depending on
        # clock resolution.
        rows = [
            resume
            for resume in self.rows.values()
            if resume.user_id == user_id and resume.storage_path
        ]
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

    def delete(self, user_id: str, resume_id: str) -> bool:
        if self.fail_on_delete:
            raise RuntimeError("database unavailable")
        resume = self.get(user_id, resume_id)
        if resume is None:
            return False
        del self.rows[resume_id]
        return True


class FakeStorage:
    """In-memory stand-in for S3StorageService (no network access)."""

    def __init__(self) -> None:
        self.objects: dict[str, dict] = {}
        self.deleted: list[str] = []
        self.signed_paths: list[str] = []
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
    ) -> str:
        self.signed_paths.append(storage_path)
        return (
            "https://storage.example.supabase.co/signed/"
            f"{storage_path}?token=test-signature"
        )


@dataclass
class Harness:
    repository: FakeResumeRepository
    storage: FakeStorage


@pytest.fixture(autouse=True)
def resume_overrides():
    limiter.enabled = False
    repository = FakeResumeRepository()
    storage = FakeStorage()

    app.dependency_overrides[get_auth_service] = lambda: FakeAuthService()
    app.dependency_overrides[get_resume_service] = lambda: ResumeService(
        repository=repository,
        storage=storage,
    )
    yield Harness(repository=repository, storage=storage)
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


def test_create_template_resume_stores_editable_source_and_pdf(client, resume_overrides):
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
        "html_content": "<main><h1>John Doe</h1><script>alert(1)</script></main>",
    }

    response = client.post("/api/v1/resumes/template", json=payload)
    body = response.json()

    assert response.status_code == 201
    assert body["resume_type"] == "template"
    assert body["editable"] is True
    assert body["template_id"] == "1"
    assert body["resume_data"]["fullName"] == "John Doe"
    assert "<script" not in body["html_content"].lower()
    assert body["file_name"] == "Template-Resume.pdf"
    assert body["download_url"]

    storage_path = f"{USER_A_ID}/resumes/{body['id']}.pdf"
    assert resume_overrides.storage.objects[storage_path]["data"].startswith(b"%PDF-")


def test_create_ai_resume_works_without_openai_key(client, resume_overrides, monkeypatch):
    monkeypatch.setattr(settings, "openai_api_key", None)
    authenticate(client)

    response = client.post(
        "/api/v1/resumes/ai",
        json={
            "title": "AI Resume",
            "prompt": "Target backend engineering roles using only my existing data.",
            "profile_context": {
                "fullName": "John Doe",
                "jobTitle": "Backend Engineer",
                "skills": ["Python"],
            },
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["resume_type"] == "ai"
    assert body["editable"] is True
    assert body["resume_data"]["fullName"] == "John Doe"
    assert body["download_url"]


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
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Updated Template"
    assert body["template_id"] == "2"
    assert body["resume_data"]["fullName"] == "John Updated"
    assert body["file_name"] == "Updated-Template.pdf"


def test_ai_edit_returns_proposal_without_saving(client, resume_overrides, monkeypatch):
    monkeypatch.setattr(settings, "openai_api_key", None)
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

    stored = resume_overrides.repository.rows[created["id"]]
    assert stored.data["fullName"] == "John Doe"
    assert stored.data.get("summary") is None


def test_generate_pdf_regenerates_editable_resume_pdf(client, resume_overrides):
    authenticate(client)
    created = client.post(
        "/api/v1/resumes/template",
        json={
            "title": "Template Resume",
            "template_id": "1",
            "resume_data": {"fullName": "John Doe", "skills": []},
        },
    ).json()

    response = client.post(f"/api/v1/resumes/{created['id']}/generate-pdf")

    assert response.status_code == 200
    body = response.json()
    assert body["download_url"]
    storage_path = f"{USER_A_ID}/resumes/{created['id']}.pdf"
    assert resume_overrides.storage.objects[storage_path]["data"].startswith(b"%PDF-")


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


def test_delete_resume_keeps_record_when_storage_delete_fails(
    client, resume_overrides
):
    created = create_resume(client).json()
    resume_overrides.storage.fail_delete = True

    response = client.delete(f"/api/v1/resumes/{created['id']}")

    assert response.status_code == 502
    assert error_code(response) == "resume_storage_error"
    # The row survives so the record never points at a deleted object, and the
    # caller can retry.
    assert created["id"] in resume_overrides.repository.rows
    assert resume_overrides.storage.deleted == []


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

