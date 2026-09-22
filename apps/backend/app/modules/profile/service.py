from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import settings
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

MAX_CERTIFICATE_BYTES = 10 * 1024 * 1024
ALLOWED_CERTIFICATE_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp"}
ALLOWED_CERTIFICATE_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
}


class ProfileService:
    def __init__(self, repository: ProfileRepository | None = None) -> None:
        self.repository = repository or ProfileRepository()

    def get_profile(self, user_id: str) -> ProfileResponse:
        personal = self._personal_response(user_id)
        return ProfileResponse(
            personal=personal,
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
        return OnboardingStatusResponse(
            personal_completed=self.repository.get_personal(user_id) is not None,
            education_count=len(self.repository.list_items(EDUCATION_TABLE, user_id)),
            experience_count=len(self.repository.list_items(EXPERIENCE_TABLE, user_id)),
            skill_count=len(self.repository.list_items(SKILLS_TABLE, user_id)),
            certificate_count=len(
                self.repository.list_items(CERTIFICATES_TABLE, user_id)
            ),
            project_count=len(self.repository.list_items(PROJECTS_TABLE, user_id)),
        )

    def upsert_personal(
        self,
        user_id: str,
        payload: PersonalInfoUpsert,
    ) -> PersonalInfoResponse:
        record = self.repository.upsert_personal(
            user_id,
            payload.model_dump(mode="json"),
        )
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
        self._ensure_personal(user_id)
        record = self.repository.update_item(
            SOCIAL_LINKS_TABLE,
            user_id,
            item_id,
            payload.model_dump(mode="json", exclude_unset=True),
        )
        if record is None:
            raise item_not_found_error("social_link")
        return SocialLinkResponse(**record)

    def delete_social_link(self, user_id: str, item_id: str) -> None:
        self._delete_item(SOCIAL_LINKS_TABLE, user_id, item_id, "social_link")

    def add_education(
        self,
        user_id: str,
        payload: EducationCreate,
    ) -> EducationResponse:
        self._ensure_personal(user_id)
        return EducationResponse(
            **self.repository.add_education(user_id, payload.model_dump(mode="json"))
        )

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
        return ExperienceResponse(
            **self.repository.add_experience(user_id, payload.model_dump(mode="json"))
        )

    def update_experience(
        self,
        user_id: str,
        item_id: str,
        payload: ExperienceUpdate,
    ) -> ExperienceResponse:
        return ExperienceResponse(
            **self._update_date_ranged_item(
                EXPERIENCE_TABLE,
                user_id,
                item_id,
                payload.model_dump(mode="json", exclude_unset=True),
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
        self._ensure_personal(user_id)
        record = self.repository.update_item(
            SKILLS_TABLE,
            user_id,
            item_id,
            payload.model_dump(mode="json"),
        )
        if record is None:
            raise item_not_found_error("skill")
        return SkillResponse(**record)

    def delete_skill(self, user_id: str, item_id: str) -> None:
        self._delete_item(SKILLS_TABLE, user_id, item_id, "skill")

    def add_certificate(
        self,
        user_id: str,
        payload: CertificateCreate,
    ) -> CertificateResponse:
        self._ensure_personal(user_id)
        data = payload.model_dump(mode="json")
        data["file_name"] = None
        return CertificateResponse(**self.repository.add_certificate(user_id, data))

    def add_certificate_upload(
        self,
        user_id: str,
        *,
        title: str,
        category: str,
        field: str,
        file: UploadFile,
    ) -> CertificateResponse:
        self._ensure_personal(user_id)
        stored_path = self._store_certificate_file(user_id, file)
        data = {
            "title": title,
            "category": category,
            "field": field,
            "file_url": stored_path,
            "file_name": Path(file.filename or stored_path).name,
        }
        return CertificateResponse(**self.repository.add_certificate(user_id, data))

    def update_certificate(
        self,
        user_id: str,
        item_id: str,
        payload: CertificateUpdate,
    ) -> CertificateResponse:
        self._ensure_personal(user_id)
        record = self.repository.update_item(
            CERTIFICATES_TABLE,
            user_id,
            item_id,
            payload.model_dump(mode="json", exclude_unset=True),
        )
        if record is None:
            raise item_not_found_error("certificate")
        return CertificateResponse(**record)

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
        self._ensure_personal(user_id)
        record = self.repository.update_item(
            PROJECTS_TABLE,
            user_id,
            item_id,
            payload.model_dump(mode="json", exclude_unset=True),
        )
        if record is None:
            raise item_not_found_error("project")
        return ProjectResponse(**record)

    def delete_project(self, user_id: str, item_id: str) -> None:
        self._delete_item(PROJECTS_TABLE, user_id, item_id, "project")

    def _personal_response(
        self,
        user_id: str,
        personal: dict[str, Any] | None = None,
    ) -> PersonalInfoResponse:
        record = personal or self.repository.get_personal(user_id)
        if record is None:
            raise profile_not_found_error()
        return PersonalInfoResponse(
            **record,
            social_links=[
                SocialLinkResponse(**item)
                for item in self.repository.list_social_links(user_id)
            ],
        )

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

    def _update_date_ranged_item(
        self,
        table: str,
        user_id: str,
        item_id: str,
        payload: dict[str, Any],
        item_name: str,
    ) -> dict[str, Any]:
        self._ensure_personal(user_id)
        existing = self.repository.get_item(table, user_id, item_id)
        if existing is None:
            raise item_not_found_error(item_name)

        start_date = payload.get("start_date", existing["start_date"])
        end_date = payload.get("end_date", existing["end_date"])
        if end_date is not None and end_date < start_date:
            raise ProfileApplicationError(
                status_code=422,
                code="invalid_date_range",
                message="End date must be on or after start date.",
            )

        record = self.repository.update_item(table, user_id, item_id, payload)
        if record is None:
            raise item_not_found_error(item_name)
        return record

    def _store_certificate_file(self, user_id: str, file: UploadFile) -> str:
        original_name = Path(file.filename or "certificate").name
        extension = Path(original_name).suffix.lower()
        if (
            extension not in ALLOWED_CERTIFICATE_EXTENSIONS
            or file.content_type not in ALLOWED_CERTIFICATE_MIME_TYPES
        ):
            raise ProfileApplicationError(
                status_code=422,
                code="invalid_certificate_file",
                message="Certificate file must be a PDF or image.",
            )

        data = file.file.read(MAX_CERTIFICATE_BYTES + 1)
        if len(data) > MAX_CERTIFICATE_BYTES:
            raise ProfileApplicationError(
                status_code=413,
                code="certificate_file_too_large",
                message="Certificate file must be 10 MB or smaller.",
            )

        upload_root = Path(settings.certificate_upload_dir)
        user_dir = upload_root / user_id
        user_dir.mkdir(parents=True, exist_ok=True)

        stored_name = f"{uuid4().hex}{extension}"
        path = user_dir / stored_name

        path.write_bytes(data)
        return str(path.as_posix())
