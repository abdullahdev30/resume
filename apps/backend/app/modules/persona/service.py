import logging
from copy import deepcopy
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from pydantic import ValidationError

from app.integrations.s3_storage import S3StorageError, S3StorageService
from app.modules.persona.repository import PersonaRepository
from app.modules.persona.schemas import (
    PersonaCreate,
    PersonaMetadata,
    PersonaPersonal,
    PersonaResponse,
)
from app.modules.profile.schemas import (
    CertificateCreate,
    EducationCreate,
    ExperienceCreate,
    ProjectCreate,
    SkillCreate,
    SocialLinkCreate,
)
from app.modules.profile.service import FILE_SIGNATURES

logger = logging.getLogger(__name__)
ENTRY_MODELS = {
    "education": EducationCreate,
    "experience": ExperienceCreate,
    "skills": SkillCreate,
    "certificates": CertificateCreate,
    "projects": ProjectCreate,
    "social_links": SocialLinkCreate,
}
PERSONAL_COMPLETION_FIELDS = (
    "first_name",
    "last_name",
    "email",
    "phone",
    "address",
    "city",
    "professional_title",
    "summary",
)


class PersonaService:
    def __init__(self, repository=None, storage=None):
        self.repository = repository or PersonaRepository()
        self.storage = storage or S3StorageService()

    def present(self, row: dict) -> PersonaResponse:
        data = deepcopy(row["data"])
        personal = data.setdefault("personal", {})
        for key in ENTRY_MODELS:
            data.setdefault(key, [])
        personal["user_id"] = str(row["user_id"])
        path = row.get("avatar_path") or personal.get("avatar_url")
        avatar_url = None
        if path:
            try:
                avatar_url = (
                    path
                    if path.startswith("https://")
                    else self.storage.generate_signed_url(path)
                )
            except S3StorageError:
                logger.warning("Could not sign persona image for %s", row["id"])
        personal["avatar_url"] = avatar_url
        for entry in data["certificates"]:
            path = entry.get("file_url")
            if path and path.startswith(f"users/{row['user_id']}/"):
                try:
                    entry["file_url"] = self.storage.generate_signed_url(path)
                except S3StorageError:
                    entry["file_url"] = None
        filled = sum(bool(personal.get(field)) for field in PERSONAL_COMPLETION_FIELDS)
        filled += sum(bool(data[key]) for key in ENTRY_MODELS)
        return PersonaResponse(
            id=str(row["id"]),
            user_id=str(row["user_id"]),
            name=row["name"],
            description=row["description"],
            data=data,
            avatar_url=avatar_url,
            completion=round(
                filled / (len(PERSONAL_COMPLETION_FIELDS) + len(ENTRY_MODELS)) * 100
            ),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    def list(self, user_id):
        return [self.present(row) for row in self.repository.list(user_id)]

    def get(self, user_id, persona_id):
        return self.present(self.repository.get(user_id, persona_id))

    def create(self, user_id, payload: PersonaCreate, account_user=None):
        personal = {}
        if payload.use_account_profile:
            if account_user is None or account_user.id != user_id:
                raise HTTPException(
                    403, "An authenticated account profile is required."
                )
            parts = (account_user.name or "").strip().split(maxsplit=1)
            personal = {
                "first_name": parts[0] if parts else None,
                "last_name": parts[1] if len(parts) > 1 else None,
                "email": account_user.email,
                "phone": account_user.number,
            }
        # Copy once, in the INSERT transaction. Subsequent persona edits never
        # update account metadata or another persona.
        return self.present(
            self.repository.create(user_id, payload.name, payload.description, personal)
        )

    def rename(self, user_id, persona_id, payload: PersonaMetadata):
        def update(row):
            row.update(name=payload.name, description=payload.description)

        return self.present(self.repository.mutate(user_id, persona_id, update))

    def personal(self, user_id, persona_id, payload: PersonaPersonal):
        def update(row):
            personal = row["data"].setdefault("personal", {})
            personal.update(
                payload.model_dump(
                    mode="json", exclude_unset=True, exclude={"social_links"}
                )
            )

        return self.present(self.repository.mutate(user_id, persona_id, update))

    def entry(
        self, user_id, persona_id, category, payload, item_id=None, stored_file=None
    ):
        # Verify ownership before validation, and again under the write lock.
        self.repository.get(user_id, persona_id)
        try:
            validated = ENTRY_MODELS[category].model_validate(payload)
            value = validated.model_dump(mode="json")
            if category == "experience":
                value["company_name"] = validated.resolved_company_name()
            if category in ("experience", "education") and value.get("is_current"):
                value["end_date"] = None
            if (
                category == "certificates"
                and value.get("expiration_date")
                and value.get("issue_date")
                and value["expiration_date"] < value["issue_date"]
            ):
                raise ValueError("Expiration date must follow issue date.")
            self.validate_links(category, value)
            if stored_file:
                value["file_url"] = stored_file
        except (ValidationError, ValueError) as exc:
            message = (
                str(exc.errors()[0]["msg"])
                if isinstance(exc, ValidationError)
                else str(exc)
            )
            raise HTTPException(
                422, detail={"code": "invalid_persona_entry", "message": message}
            ) from exc

        def update(row):
            entries = row["data"].setdefault(category, [])
            value["id"] = item_id or str(uuid4())
            if item_id:
                index = next(
                    (i for i, entry in enumerate(entries) if entry["id"] == item_id),
                    None,
                )
                if index is None:
                    raise HTTPException(404, "Entry not found.")
                # Preserve an uploaded certificate unless explicitly replaced.
                if category == "certificates" and "file_url" not in payload:
                    value["file_url"] = entries[index].get("file_url")
                entries[index] = value
            else:
                entries.append(value)

        return self.present(self.repository.mutate(user_id, persona_id, update))

    async def certificate(
        self,
        user_id,
        persona_id,
        file,
        title,
        category=None,
        field=None,
        issue_date=None,
        expiration_date=None,
    ):
        self.repository.get(user_id, persona_id)
        payload = {
            "title": title,
            "category": category,
            "field": field,
            "issue_date": issue_date or None,
            "expiration_date": expiration_date or None,
        }
        try:
            CertificateCreate.model_validate(payload)
        except ValidationError as exc:
            raise HTTPException(422, "Check the certificate title and dates.") from exc
        data = await file.read(10 * 1024 * 1024 + 1)
        content_type = file.content_type
        if len(data) > 10 * 1024 * 1024:
            raise HTTPException(413, "Choose a document of 10 MB or less.")
        extensions = {
            "application/pdf": ".pdf",
            "image/png": ".png",
            "image/jpeg": ".jpg",
            "image/webp": ".webp",
        }
        valid = content_type in extensions and any(
            data.startswith(signature) for signature in FILE_SIGNATURES[content_type]
        )
        if content_type == "image/webp":
            valid = valid and data[8:12] == b"WEBP"
        if not valid:
            raise HTTPException(422, "Choose a valid PDF, PNG, JPG, or WEBP document.")
        path = f"users/{user_id}/personas/{persona_id}/{uuid4().hex}{extensions[content_type]}"
        try:
            await self.storage.upload_bytes(path, data, content_type)
            try:
                return self.entry(
                    user_id, persona_id, "certificates", payload, stored_file=path
                )
            except Exception:
                await self.storage.delete_object(path)
                raise
        except S3StorageError as exc:
            raise HTTPException(
                502, "The certificate could not be uploaded. Please try again."
            ) from exc

    def remove_entry(self, user_id, persona_id, category, item_id):
        def update(row):
            entries = row["data"].setdefault(category, [])
            if not any(entry["id"] == item_id for entry in entries):
                raise HTTPException(404, "Entry not found.")
            row["data"][category] = [
                entry for entry in entries if entry["id"] != item_id
            ]

        return self.present(self.repository.mutate(user_id, persona_id, update))

    @staticmethod
    def validate_links(category, value):
        from urllib.parse import urlsplit

        for key in {
            "certificates": ("file_url",),
            "projects": ("link", "github_url"),
        }.get(category, ()):
            url = value.get(key)
            if url:
                parsed = urlsplit(url)
                if parsed.scheme not in {"http", "https"} or not parsed.hostname:
                    raise ValueError("Links must be complete http or https URLs.")

    async def avatar(self, user_id, persona_id, file: UploadFile):
        old = self.repository.get(user_id, persona_id)
        content_type = file.content_type
        data = await file.read(5 * 1024 * 1024 + 1)
        types = {
            "image/png": (".png", data.startswith(b"\x89PNG\r\n\x1a\n")),
            "image/jpeg": (".jpg", data.startswith(b"\xff\xd8\xff")),
            "image/webp": (".webp", data.startswith(b"RIFF") and data[8:12] == b"WEBP"),
        }
        if len(data) > 5 * 1024 * 1024:
            raise HTTPException(413, "Choose an image of 5 MB or less.")
        if content_type not in types or not types[content_type][1]:
            raise HTTPException(422, "Choose a valid PNG, JPG, or WEBP image.")
        path = f"users/{user_id}/personas/{persona_id}/{uuid4().hex}{types[content_type][0]}"
        try:
            await self.storage.upload_bytes(path, data, content_type)
            try:
                row = self.repository.mutate(
                    user_id, persona_id, lambda row: row.update(avatar_path=path)
                )
            except Exception:
                await self.storage.delete_object(path)
                raise
        except S3StorageError as exc:
            raise HTTPException(
                502, "The image could not be uploaded. Please try again."
            ) from exc
        await self.cleanup(user_id, persona_id, old.get("avatar_path"))
        return self.present(row)

    async def cleanup(self, user_id, persona_id, path):
        if path and path.startswith(f"users/{user_id}/personas/{persona_id}/"):
            try:
                await self.storage.delete_object(path)
            except S3StorageError:
                logger.warning(
                    "Could not remove replaced persona image for %s", persona_id
                )

    async def remove_avatar(self, user_id, persona_id):
        old = self.repository.get(user_id, persona_id)

        def update(row):
            row["avatar_path"] = None
            row["data"].setdefault("personal", {}).pop("avatar_url", None)

        row = self.repository.mutate(user_id, persona_id, update)
        await self.cleanup(user_id, persona_id, old.get("avatar_path"))
        return self.present(row)

    async def avatar_snapshot(self, user_id, persona_id):
        import base64
        from io import BytesIO

        from PIL import Image, ImageOps
        from starlette.concurrency import run_in_threadpool

        row = self.repository.get(user_id, persona_id)
        path = row.get("avatar_path") or row["data"].get("personal", {}).get(
            "avatar_url"
        )
        if not path:
            return {"data_url": None}
        if not path.startswith(f"users/{user_id}/"):
            raise HTTPException(422, "This photo cannot be copied into a resume.")
        try:
            data, _ = await self.storage.download_bytes(path)

            def resize():
                with Image.open(BytesIO(data)) as image:
                    if image.width * image.height > 20_000_000:
                        raise ValueError("Photo is too large.")
                    image = ImageOps.exif_transpose(image)
                    image.thumbnail((512, 512))
                    buffer = BytesIO()
                    image.convert("RGB").save(
                        buffer, format="JPEG", quality=85, optimize=True
                    )
                    return buffer.getvalue()

            encoded = base64.b64encode(await run_in_threadpool(resize)).decode()
        except (S3StorageError, OSError, ValueError) as exc:
            raise HTTPException(
                422,
                "The persona photo could not be copied. Try uploading a smaller photo.",
            ) from exc
        return {"data_url": f"data:image/jpeg;base64,{encoded}"}

    async def delete(self, user_id, persona_id):
        row = self.repository.delete(user_id, persona_id)
        await self.cleanup(user_id, persona_id, row.get("avatar_path"))
        for entry in row["data"].get("certificates", []):
            await self.cleanup(user_id, persona_id, entry.get("file_url"))
