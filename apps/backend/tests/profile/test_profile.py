from dataclasses import dataclass

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.auth.dependencies import get_auth_service
from app.modules.auth.schemas import UserResponse
from app.modules.profile import router as profile_router
from app.modules.profile.repository import ProfileRepository
from app.modules.profile.service import ProfileService


@dataclass
class FakeAuthService:
    def get_current_user(self, access_token):
        return UserResponse(
            id="user-123",
            email="john@example.com",
            name="John Doe",
            number="03001234567",
            email_verified=True,
        )


@pytest.fixture(autouse=True)
def app_overrides(tmp_path):
    app.dependency_overrides[get_auth_service] = lambda: FakeAuthService()
    original_service = profile_router.profile_service
    profile_router.profile_service = ProfileService(
        ProfileRepository(str(tmp_path / "profile.sqlite3"))
    )
    yield
    profile_router.profile_service = original_service
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(app)


def auth_headers():
    return {"Authorization": "Bearer access-token"}


def personal_payload():
    return {
        "first_name": "John",
        "last_name": "Doe",
        "email": "JOHN@EXAMPLE.COM",
        "phone": "03001234567",
        "address": "123 Main Street",
        "social_links": [
            {
                "platform_name": "LinkedIn",
                "profile_url": "https://linkedin.com/in/johndoe",
            }
        ],
    }


def create_personal(client):
    return client.post(
        "/api/v1/profile/onboarding/personal",
        json=personal_payload(),
        headers=auth_headers(),
    )


def test_optional_sections_require_personal_profile_first(client):
    response = client.post(
        "/api/v1/profile/onboarding/education",
        json={
            "institute_name": "University",
            "field_of_study": "Computer Science",
            "start_date": "2020-01-01",
            "end_date": "2024-01-01",
            "grade": "A",
        },
        headers=auth_headers(),
    )

    assert response.status_code == 404


def test_personal_onboarding_is_required_and_normalizes_email(client):
    response = create_personal(client)

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "john@example.com"
    assert body["first_name"] == "John"
    assert body["social_links"][0]["platform_name"] == "LinkedIn"


def test_profile_supports_multiple_optional_sections(client):
    create_personal(client)

    education = client.post(
        "/api/v1/profile/onboarding/education",
        json={
            "institute_name": "University",
            "field_of_study": "Computer Science",
            "start_date": "2020-01-01",
            "end_date": "2024-01-01",
            "grade": "A",
        },
        headers=auth_headers(),
    )
    experience = client.post(
        "/api/v1/profile/onboarding/experience",
        json={
            "institute_name": "Acme",
            "job_title": "Frontend Engineer",
            "start_date": "2024-02-01",
            "end_date": None,
        },
        headers=auth_headers(),
    )
    skill = client.post(
        "/api/v1/profile/onboarding/skills",
        json={"name": "React"},
        headers=auth_headers(),
    )
    certificate = client.post(
        "/api/v1/profile/onboarding/certificates",
        json={
            "title": "AWS Certificate",
            "category": "Cloud",
            "field": "DevOps",
            "file_url": "https://example.com/certificate.pdf",
        },
        headers=auth_headers(),
    )
    project = client.post(
        "/api/v1/profile/projects",
        json={
            "name": "Portfolio",
            "description": "Personal portfolio",
            "type": "Web",
            "link": "https://example.com",
        },
        headers=auth_headers(),
    )

    assert education.status_code == 201
    assert experience.status_code == 201
    assert skill.status_code == 201
    assert certificate.status_code == 201
    assert project.status_code == 201

    profile = client.get("/api/v1/profile", headers=auth_headers())
    body = profile.json()

    assert profile.status_code == 200
    assert len(body["education"]) == 1
    assert len(body["experience"]) == 1
    assert len(body["skills"]) == 1
    assert len(body["certificates"]) == 1
    assert len(body["projects"]) == 1


def test_update_and_delete_skill(client):
    create_personal(client)
    created = client.post(
        "/api/v1/profile/skills",
        json={"name": "React"},
        headers=auth_headers(),
    )
    item_id = created.json()["id"]

    updated = client.put(
        f"/api/v1/profile/skills/{item_id}",
        json={"name": "Next.js"},
        headers=auth_headers(),
    )
    deleted = client.delete(
        f"/api/v1/profile/skills/{item_id}",
        headers=auth_headers(),
    )
    profile = client.get("/api/v1/profile", headers=auth_headers())

    assert updated.status_code == 200
    assert updated.json()["name"] == "Next.js"
    assert deleted.status_code == 200
    assert profile.json()["skills"] == []


def test_certificate_upload(client):
    create_personal(client)

    response = client.post(
        "/api/v1/profile/certificates/upload",
        data={
            "title": "Transcript",
            "category": "Education",
            "field": "Computer Science",
        },
        files={"file": ("transcript.pdf", b"fake pdf", "application/pdf")},
        headers=auth_headers(),
    )

    assert response.status_code == 201
    assert response.json()["file_name"] == "transcript.pdf"
    assert response.json()["category"] == "Education"
