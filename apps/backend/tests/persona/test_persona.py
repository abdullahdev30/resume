from copy import deepcopy
from threading import RLock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.auth.dependencies import get_auth_service
from app.modules.auth.errors import invalid_session_error
from app.modules.auth.schemas import UserResponse
from app.modules.persona.repository import PersonaRepository
from app.modules.persona.router import get_persona_service
from app.modules.persona.service import PersonaService


class MemoryPersonaRepository:
    def __init__(self):
        self.rows = {}
        self.lock = RLock()

    def list(self, user_id):
        return [
            deepcopy(row) for row in self.rows.values() if row["user_id"] == user_id
        ]

    def get(self, user_id, persona_id):
        row = self.rows.get(persona_id)
        return deepcopy(
            PersonaRepository.require(
                row if row and row["user_id"] == user_id else None
            )
        )

    def create(self, user_id, name, description, personal=None):
        row = {
            "id": str(uuid4()),
            "user_id": user_id,
            "name": name,
            "description": description,
            "avatar_path": None,
            "data": {
                "personal": personal or {},
                "education": [],
                "experience": [],
                "skills": [],
                "projects": [],
                "certificates": [],
                "social_links": [],
            },
            "created_at": "2026-10-20T12:00:00Z",
            "updated_at": "2026-10-20T12:00:00Z",
        }
        self.rows[row["id"]] = deepcopy(row)
        return deepcopy(row)

    def mutate(self, user_id, persona_id, update):
        with self.lock:
            row = self.get(user_id, persona_id)
            update(row)
            self.rows[persona_id] = deepcopy(row)
            return deepcopy(row)

    def delete(self, user_id, persona_id):
        row = self.get(user_id, persona_id)
        del self.rows[persona_id]
        return row


class MemoryStorage:
    def __init__(self):
        self.files = {}
        self.deleted = []

    async def upload_bytes(self, path, data, content_type):
        self.files[path] = (data, content_type)

    async def delete_object(self, path):
        self.files.pop(path, None)
        self.deleted.append(path)

    async def download_bytes(self, path):
        return self.files[path]

    def generate_signed_url(self, path):
        return "https://storage.example.com/" + path


class Auth:
    def get_current_user(self, token):
        if token == "anonymous":
            raise invalid_session_error()
        return UserResponse(
            id=token,
            name="Account Owner",
            number="+12025550123",
            email="person@example.com",
        )


@pytest.fixture
def setup():
    service = PersonaService(MemoryPersonaRepository(), MemoryStorage())
    app.dependency_overrides[get_auth_service] = lambda: Auth()
    app.dependency_overrides[get_persona_service] = lambda: service
    client = TestClient(app)
    client.cookies.set("access_token", "owner")
    yield client, service
    app.dependency_overrides.clear()


def create(client, name="Engineering"):
    response = client.post(
        "/api/v1/personas", json={"name": name, "description": "Backend roles"}
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_personas_are_registered_account_only(setup):
    client, _ = setup
    client.cookies.clear()
    assert client.get("/api/v1/personas").status_code == 401
    client.cookies.set("access_token", "anonymous")
    assert (
        client.post("/api/v1/personas", json={"name": "Anonymous"}).status_code == 401
    )


def test_multiple_personas_remain_independent_and_persist_all_categories(setup):
    client, _ = setup
    first = create(client)
    second = create(client, "Design")
    base = f"/api/v1/personas/{first['id']}"
    assert (
        client.put(
            base + "/personal",
            json={
                "first_name": "Alex",
                "email": "alex@example.com",
                "city": "Lahore",
                "country": "Pakistan",
            },
        ).status_code
        == 200
    )
    payloads = {
        "education": {
            "institute_name": "University",
            "start_date": "2020-01-01",
            "is_current": True,
        },
        "experience": {
            "job_title": "Engineer",
            "company_name": "Company",
            "start_date": "2023-01-01",
        },
        "skills": {"name": "Python"},
        "projects": {"name": "Portfolio", "technologies": ["React"]},
        "certificates": {"title": "Cloud certification"},
        "social_links": {
            "platform_name": "GitHub",
            "profile_url": "https://github.com/alex",
        },
    }
    for category, payload in payloads.items():
        assert client.post(base + "/" + category, json=payload).status_code == 201
    stored = client.get(base).json()
    assert all(len(stored["data"][key]) == 1 for key in payloads)
    assert stored["completion"] > 0
    untouched = client.get(f"/api/v1/personas/{second['id']}").json()
    assert untouched["completion"] == 0
    assert untouched["data"]["personal"].get("email") is None
    assert len(client.get("/api/v1/personas").json()) == 2


def test_ownership_checked_for_every_operation(setup):
    client, _ = setup
    persona = create(client)
    base = f"/api/v1/personas/{persona['id']}"
    client.cookies.set("access_token", "other-owner")
    assert client.get("/api/v1/personas").json() == []
    for method, url, body in [
        ("get", base, None),
        ("put", base, {"name": "Stolen"}),
        ("put", base + "/personal", {"first_name": "Stolen"}),
        ("post", base + "/skills", {"name": "Stolen"}),
        ("delete", base, None),
        ("delete", base + "/avatar", None),
    ]:
        assert client.request(method, url, json=body).status_code == 404
    assert (
        client.post(
            base + "/avatar", files={"file": ("photo.png", b"bad", "image/png")}
        ).status_code
        == 404
    )


def test_entry_edits_deletes_and_partial_personal_updates(setup):
    client, _ = setup
    base = f"/api/v1/personas/{create(client)['id']}"
    client.put(base + "/personal", json={"first_name": "Alex", "city": "Paris"})
    updated = client.put(base + "/personal", json={"city": None}).json()
    assert updated["data"]["personal"]["first_name"] == "Alex"
    assert updated["data"]["personal"]["city"] is None
    response = client.post(base + "/skills", json={"name": "Python"}).json()
    item_id = response["data"]["skills"][0]["id"]
    response = client.put(base + "/skills/" + item_id, json={"name": "TypeScript"})
    assert response.json()["data"]["skills"][0]["name"] == "TypeScript"
    assert client.delete(base + "/skills/" + item_id).json()["data"]["skills"] == []
    assert client.delete(base + "/skills/" + item_id).status_code == 404


@pytest.mark.parametrize(
    "category,payload",
    [
        ("experience", {"job_title": "Engineer", "start_date": "2025-01-01"}),
        (
            "education",
            {
                "institute_name": "School",
                "start_date": "2025-01-01",
                "end_date": "2020-01-01",
            },
        ),
        ("projects", {"name": "Project", "link": "javascript:alert(1)"}),
        (
            "certificates",
            {"title": "Certification", "file_url": "users/other-owner/secret.pdf"},
        ),
        ("social_links", {"platform_name": "GitHub", "profile_url": "not a url"}),
    ],
)
def test_invalid_entries_do_not_modify_persona(setup, category, payload):
    client, _ = setup
    base = f"/api/v1/personas/{create(client)['id']}"
    assert client.post(base + "/" + category, json=payload).status_code == 422
    assert client.get(base).json()["data"][category] == []


def test_metadata_and_photo_lifecycle(setup):
    client, service = setup
    base = f"/api/v1/personas/{create(client)['id']}"
    assert client.put(base, json={"name": " ", "description": ""}).status_code == 422
    assert (
        client.put(
            base, json={"name": "Career change", "description": "New role"}
        ).json()["name"]
        == "Career change"
    )
    assert (
        client.post(
            base + "/avatar",
            files={"file": ("fake.png", b"wrong signature", "image/png")},
        ).status_code
        == 422
    )
    response = client.post(
        base + "/avatar",
        files={"file": ("photo.png", b"\x89PNG\r\n\x1a\nimage", "image/png")},
    )
    assert response.status_code == 200
    assert response.json()["avatar_url"].startswith(
        "https://storage.example.com/users/owner/personas/"
    )
    assert len(service.storage.files) == 1
    assert client.delete(base + "/avatar").json()["avatar_url"] is None
    assert not service.storage.files
    assert client.delete(base).status_code == 200
    assert client.get(base).status_code == 404


def test_certificate_upload_preserves_private_path_when_editing_and_cleans_up(setup):
    client, service = setup
    base = f"/api/v1/personas/{create(client)['id']}"
    response = client.post(
        base + "/certificates/upload",
        data={"title": "Cloud certificate"},
        files={
            "file": ("certificate.pdf", b"%PDF-1.4\ncertificate", "application/pdf")
        },
    )
    assert response.status_code == 201, response.text
    entry = response.json()["data"]["certificates"][0]
    path = next(iter(service.storage.files))
    response = client.put(
        base + "/certificates/" + entry["id"], json={"title": "Updated certificate"}
    )
    assert response.status_code == 200
    assert (
        service.repository.get("owner", base.split("/")[-1])["data"]["certificates"][0][
            "file_url"
        ]
        == path
    )
    assert client.delete(base + "/certificates/" + entry["id"]).status_code == 200
    assert not service.storage.files


def test_copying_account_details_is_optional_and_never_changes_account(setup):
    client, _ = setup
    account_before = client.get("/api/v1/auth/profile").json()
    copied = client.post(
        "/api/v1/personas", json={"name": "Work", "use_account_profile": True}
    )
    assert copied.status_code == 201
    personal = copied.json()["data"]["personal"]
    assert (
        personal["first_name"],
        personal["last_name"],
        personal["email"],
        personal["phone"],
    ) == ("Account", "Owner", "person@example.com", "+12025550123")
    base = f"/api/v1/personas/{copied.json()['id']}"
    assert (
        client.put(
            base + "/personal",
            json={"first_name": "Different", "email": "different@example.com"},
        ).status_code
        == 200
    )
    assert client.get("/api/v1/auth/profile").json() == account_before
    blank = client.post(
        "/api/v1/personas", json={"name": "Independent", "use_account_profile": False}
    ).json()
    assert blank["data"]["personal"].get("email") is None
    assert (
        client.get(base).json()["data"]["personal"]["email"] == "different@example.com"
    )
    assert (
        client.put(
            base, json={"name": "Renamed", "use_account_profile": True}
        ).status_code
        == 422
    )
    assert client.delete(base).status_code == 200
    assert client.get("/api/v1/auth/profile").json() == account_before


def test_openapi_separates_account_profile_from_persona_api():
    paths = app.openapi()["paths"]
    assert paths["/api/v1/auth/profile"]["get"]["tags"] == ["Auth"]
    assert paths["/api/v1/personas"]["get"]["tags"] == ["Persona"]
    assert "/api/v1/profile" not in paths


def test_avatar_snapshot_is_private_and_embeds_a_resized_photo(setup):
    import base64
    from io import BytesIO

    from PIL import Image

    client, _ = setup
    base = f"/api/v1/personas/{create(client)['id']}"
    assert client.get(base + "/avatar/snapshot").json() == {"data_url": None}
    photo = BytesIO()
    Image.new("RGB", (1000, 800), "white").save(photo, "PNG")
    assert (
        client.post(
            base + "/avatar",
            files={"file": ("photo.png", photo.getvalue(), "image/png")},
        ).status_code
        == 200
    )
    response = client.get(base + "/avatar/snapshot")
    assert response.status_code == 200
    data_url = response.json()["data_url"]
    assert data_url.startswith("data:image/jpeg;base64,")
    with Image.open(BytesIO(base64.b64decode(data_url.split(",", 1)[1]))) as image:
        assert image.size == (512, 410)
    client.cookies.set("access_token", "other-owner")
    assert client.get(base + "/avatar/snapshot").status_code == 404
