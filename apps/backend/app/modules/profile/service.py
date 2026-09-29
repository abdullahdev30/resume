from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.integrations.s3_storage import S3StorageService
from app.modules.profile.errors import (
    ProfileApplicationError,
    item_not_found_error,
    profile_not_found_error,
)
from app.modules.profile.repository import ProfileRepository
from app.modules.profile.schemas import (
    CertificateCreate,
    CertificateResponse,
    CertificateUpdate,
    EducationCreate,
    EducationResponse,
    EducationUpdate,
    ExperienceCreate,
    ExperienceResponse,
    ExperienceUpdate,
    OnboardingStatusResponse,
    PersonalInfoResponse,
    PersonalInfoUpsert,
    ProfileResponse,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
    SkillCreate,
    SkillResponse,
    SkillUpdate,
    SocialLinkCreate,
    SocialLinkResponse,
    SocialLinkUpdate,
)

EDUCATION_TABLE = "profile_education"
EXPERIENCE_TABLE = "profile_experience"
SKILLS_TABLE = "profile_skills"
CERTIFICATES_TABLE = "profile_certificates"
PROJECTS_TABLE = "profile_projects"
SOCIAL_LINKS_TABLE = "profile_social_links"

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_DOCUMENT_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp"}
ALLOWED_AVATAR_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
}
FILE_SIGNATURES = {
    "application/pdf": (b"%PDF",),
    "image/png": (b"\x89PNG\r\n\x1a\n",),
    "image/jpeg": (b"\xff\xd8\xff",),
    "image/webp": (b"RIFF",),
}


class ProfileService:
    def __init__(
        self,
        repository: ProfileRepository | None = None,
        storage: S3StorageService | None = None,
    ) -> None:
        self.repository = repository or ProfileRepository()
        self.storage = storage or S3StorageService()

    def get_profile(self, user_id: str) -> ProfileResponse:
        personal = self._personal_response(user_id)
        social_links = self._social_links(user_id)
        return ProfileResponse(
            personal=personal,
            social_links=social_links,
            education=[
                EducationResponse(**item)
                for item in self.repository.list_items(EDUCATION_TABLE, user_id)
            ],
            experience=[
                ExperienceResponse(**item)
                for item in self.repository.list_items(EXPERIENCE_TABLE, user_id)
            ],
            skills=[
                SkillResponse(**item)
                for item in self.repository.list_items(SKILLS_TABLE, user_id)
            ],
            certificates=[
                CertificateResponse(**item)
                for item in self.repository.list_items(CERTIFICATES_TABLE, user_id)
            ],
            projects=[
                ProjectResponse(**item)
                for item in self.repository.list_items(PROJECTS_TABLE, user_id)
            ],
        )

    def onboarding_status(self, user_id: str) -> OnboardingStatusResponse:
        personal = self.repository.get_personal(user_id)
        education_count = len(self.repository.list_items(EDUCATION_TABLE, user_id))
        experience_count = len(self.repository.list_items(EXPERIENCE_TABLE, user_id))
        skill_count = len(self.repository.list_items(SKILLS_TABLE, user_id))
        certificate_count = len(self.repository.list_items(CERTIFICATES_TABLE, user_id))
        project_count = len(self.repository.list_items(PROJECTS_TABLE, user_id))
        social_link_count = len(self.repository.list_social_links(user_id))
        personal_completed = personal is not None
        current_step = self._current_step(
            personal_completed=personal_completed,
            education_count=education_count,
            experience_count=experience_count,
            skill_count=skill_count,
        )
        return OnboardingStatusResponse(
            current_step=current_step,
            is_completed=bool(
                personal
                and personal.get("onboarding_completed")
                and education_count
                and skill_count
            ),
            personal_completed=personal_completed,
            education_count=education_count,
            experience_count=experience_count,
            skill_count=skill_count,
            certificate_count=certificate_count,
            project_count=project_count,
            social_link_count=social_link_count,
            data={"personal": personal} if personal else {},
        )

    def upsert_personal(
        self,
        user_id: str,
        payload: PersonalInfoUpsert,
    ) -> PersonalInfoResponse:
        try:
            first_name = payload.resolved_first_name()
        except ValueError as exc:
            raise ProfileApplicationError(
                status_code=422,
                code="invalid_personal_info",
                message=str(exc),
            ) from exc

        data = payload.model_dump(mode="json")
        data["first_name"] = first_name
        record = self.repository.upsert_personal(user_id, data)
        return self._personal_response(user_id, record)

    async def upload_avatar(self, user_id: str, file: UploadFile) -> PersonalInfoResponse:
        self._ensure_personal(user_id)
        storage_path = await self._store_file(
            user_id=user_id,
            file=file,
            section="avatars",
            allowed_extensions=ALLOWED_AVATAR_EXTENSIONS,
            allowed_mime_types=ALLOWED_MIME_TYPES - {"application/pdf"},
        )
        record = self.repository.update_avatar(user_id, storage_path)
        if record is None:
            raise profile_not_found_error()
        return self._personal_response(user_id, record)

    def add_social_link(
        self,
        user_id: str,
        payload: SocialLinkCreate,
    ) -> SocialLinkResponse:
        self._ensure_personal(user_id)
        return SocialLinkResponse(
            **self.repository.add_social_link(
                user_id,
                payload.model_dump(mode="json"),
            )
        )

    def update_social_link(
        self,
        user_id: str,
        item_id: str,
        payload: SocialLinkUpdate,
    ) -> SocialLinkResponse:
        return SocialLinkResponse(
            **self._update_item(
                SOCIAL_LINKS_TABLE,
                user_id,
                item_id,
                payload.model_dump(mode="json", exclude_unset=True),
                "social_link",
            )
        )

    def delete_social_link(self, user_id: str, item_id: str) -> None:
        self._delete_item(SOCIAL_LINKS_TABLE, user_id, item_id, "social_link")

    def add_education(
        self,
        user_id: str,
        payload: EducationCreate,
    ) -> EducationResponse:
        self._ensure_personal(user_id)
        data = payload.model_dump(mode="json")
        return EducationResponse(**self.repository.add_education(user_id, data))

    def update_education(
        self,
        user_id: str,
        item_id: str,
        payload: EducationUpdate,
    ) -> EducationResponse:
        return EducationResponse(
            **self._update_date_ranged_item(
                EDUCATION_TABLE,
                user_id,
                item_id,
                payload.model_dump(mode="json", exclude_unset=True),
                "education",
            )
        )

    def delete_education(self, user_id: str, item_id: str) -> None:
        self._delete_item(EDUCATION_TABLE, user_id, item_id, "education")

    def add_experience(
        self,
        user_id: str,
        payload: ExperienceCreate,
    ) -> ExperienceResponse:
        self._ensure_personal(user_id)
        try:
            company_name = payload.resolved_company_name()
        except ValueError as exc:
            raise ProfileApplicationError(
                status_code=422,
                code="invalid_experience",
                message=str(exc),
            ) from exc
        data = payload.model_dump(mode="json")
        data["company_name"] = company_name
        return ExperienceResponse(**self.repository.add_experience(user_id, data))

    def update_experience(
        self,
        user_id: str,
        item_id: str,
        payload: ExperienceUpdate,
    ) -> ExperienceResponse:
        data = payload.model_dump(mode="json", exclude_unset=True)
        if data.get("institute_name") and not data.get("company_name"):
            data["company_name"] = data["institute_name"]
        return ExperienceResponse(
            **self._update_date_ranged_item(
                EXPERIENCE_TABLE,
                user_id,
                item_id,
                data,
                "experience",
            )
        )

    def delete_experience(self, user_id: str, item_id: str) -> None:
        self._delete_item(EXPERIENCE_TABLE, user_id, item_id, "experience")

    def add_skill(self, user_id: str, payload: SkillCreate) -> SkillResponse:
        self._ensure_personal(user_id)
        return SkillResponse(
            **self.repository.add_skill(user_id, payload.model_dump(mode="json"))
        )

    def update_skill(
        self,
        user_id: str,
        item_id: str,
        payload: SkillUpdate,
    ) -> SkillResponse:
        return SkillResponse(
            **self._update_item(
                SKILLS_TABLE,
                user_id,
                item_id,
                payload.model_dump(mode="json", exclude_unset=True),
                "skill",
            )
        )

    def delete_skill(self, user_id: str, item_id: str) -> None:
        self._delete_item(SKILLS_TABLE, user_id, item_id, "skill")

    def add_certificate(
        self,
        user_id: str,
        payload: CertificateCreate,
    ) -> CertificateResponse:
        self._ensure_personal(user_id)
        return CertificateResponse(
            **self.repository.add_certificate(user_id, payload.model_dump(mode="json"))
        )

    async def add_certificate_upload(
        self,
        user_id: str,
        *,
        title: str,
        category: str | None,
        field: str | None,
        file: UploadFile,
    ) -> CertificateResponse:
        self._ensure_personal(user_id)
        storage_path = await self._store_file(
            user_id=user_id,
            file=file,
            section="certificates",
            allowed_extensions=ALLOWED_DOCUMENT_EXTENSIONS,
            allowed_mime_types=ALLOWED_MIME_TYPES,
        )
        data = {
            "title": title,
            "category": category,
            "field": field,
            "file_url": storage_path,
            "file_name": Path(file.filename or storage_path).name,
        }
        return CertificateResponse(**self.repository.add_certificate(user_id, data))

    def update_certificate(
        self,
        user_id: str,
        item_id: str,
        payload: CertificateUpdate,
    ) -> CertificateResponse:
        return CertificateResponse(
            **self._update_item(
                CERTIFICATES_TABLE,
                user_id,
                item_id,
                payload.model_dump(mode="json", exclude_unset=True),
                "certificate",
            )
        )

    def delete_certificate(self, user_id: str, item_id: str) -> None:
        self._delete_item(CERTIFICATES_TABLE, user_id, item_id, "certificate")

    def add_project(self, user_id: str, payload: ProjectCreate) -> ProjectResponse:
        self._ensure_personal(user_id)
        return ProjectResponse(
            **self.repository.add_project(user_id, payload.model_dump(mode="json"))
        )

    def update_project(
        self,
        user_id: str,
        item_id: str,
        payload: ProjectUpdate,
    ) -> ProjectResponse:
        return ProjectResponse(
            **self._update_item(
                PROJECTS_TABLE,
                user_id,
                item_id,
                payload.model_dump(mode="json", exclude_unset=True),
                "project",
            )
        )

    def delete_project(self, user_id: str, item_id: str) -> None:
        self._delete_item(PROJECTS_TABLE, user_id, item_id, "project")

    def _personal_response(
        self,
        user_id: str,
        personal: dict | None = None,
    ) -> PersonalInfoResponse:
        record = personal or self.repository.get_personal(user_id)
        if record is None:
            raise profile_not_found_error()
        return PersonalInfoResponse(
            **record,
            social_links=self._social_links(user_id),
        )

    def _social_links(self, user_id: str) -> list[SocialLinkResponse]:
        return [
            SocialLinkResponse(**item)
            for item in self.repository.list_social_links(user_id)
        ]

    def _ensure_personal(self, user_id: str) -> None:
        if self.repository.get_personal(user_id) is None:
            raise profile_not_found_error()

    def _delete_item(
        self,
        table: str,
        user_id: str,
        item_id: str,
        item_name: str,
    ) -> None:
        self._ensure_personal(user_id)
        if not self.repository.delete_item(table, user_id, item_id):
            raise item_not_found_error(item_name)

    def _update_item(
        self,
        table: str,
        user_id: str,
        item_id: str,
        payload: dict,
        item_name: str,
    ) -> dict:
        self._ensure_personal(user_id)
        record = self.repository.update_item(table, user_id, item_id, payload)
        if record is None:
            raise item_not_found_error(item_name)
        return record

    def _update_date_ranged_item(
        self,
        table: str,
        user_id: str,
        item_id: str,
        payload: dict,
        item_name: str,
    ) -> dict:
        self._ensure_personal(user_id)
        existing = self.repository.get_item(table, user_id, item_id)
        if existing is None:
            raise item_not_found_error(item_name)

        start_date = payload.get("start_date", existing.get("start_date"))
        end_date = payload.get("end_date", existing.get("end_date"))
        if end_date is not None and start_date is not None and end_date < start_date:
            raise ProfileApplicationError(
                status_code=422,
                code="invalid_date_range",
                message="End date must be on or after start date.",
            )

        record = self.repository.update_item(table, user_id, item_id, payload)
        if record is None:
            raise item_not_found_error(item_name)
        return record

    async def _store_file(
        self,
        *,
        user_id: str,
        file: UploadFile,
        section: str,
        allowed_extensions: set[str],
        allowed_mime_types: set[str],
    ) -> str:
        original_name = Path(file.filename or section).name
        extension = Path(original_name).suffix.lower()
        content_type = file.content_type or "application/octet-stream"
        if extension not in allowed_extensions or content_type not in allowed_mime_types:
            raise ProfileApplicationError(
                status_code=422,
                code="invalid_upload_file",
                message="Uploaded file type is not allowed.",
            )

        data = await file.read(MAX_UPLOAD_BYTES + 1)
        if len(data) > MAX_UPLOAD_BYTES:
            raise ProfileApplicationError(
                status_code=413,
                code="upload_file_too_large",
                message="Uploaded file must be 10 MB or smaller.",
            )
        storage_path = f"users/{user_id}/{section}/{uuid4().hex}{extension}"
        if not isinstance(self.repository, ProfileRepository):
            return storage_path

        self._validate_file_signature(content_type, data)

        await self.storage.upload_bytes(storage_path, data, content_type)
        return storage_path

    def _validate_file_signature(self, content_type: str, data: bytes) -> None:
        signatures = FILE_SIGNATURES.get(content_type)
        if not signatures:
            return
        if content_type == "image/webp":
            is_valid = data.startswith(b"RIFF") and data[8:12] == b"WEBP"
        else:
            is_valid = any(data.startswith(signature) for signature in signatures)
        if not is_valid:
            raise ProfileApplicationError(
                status_code=422,
                code="invalid_file_signature",
                message="Uploaded file content does not match its declared type.",
            )

    def _current_step(
        self,
        *,
        personal_completed: bool,
        education_count: int,
        experience_count: int,
        skill_count: int,
    ) -> int:
        if not personal_completed:
            return 1
        if education_count == 0:
            return 2
        if experience_count == 0:
            return 3
        if skill_count == 0:
            return 4
        return 5
