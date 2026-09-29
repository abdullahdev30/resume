import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import settings
from app.integrations.s3_storage import S3StorageError, S3StorageService
from app.modules.resume.errors import (
    invalid_resume_file_error,
    resume_file_too_large_error,
    resume_not_found_error,
    resume_persistence_error,
    resume_storage_error,
    resume_update_error,
)
from app.modules.resume.models import Resume
from app.modules.resume.repository import ResumeRepository
from app.modules.resume.schemas import ResumeResponse

logger = logging.getLogger(__name__)

PDF_EXTENSION = ".pdf"
PDF_MIME_TYPE = "application/pdf"
PDF_SIGNATURE = b"%PDF-"


class ResumeService:
    """Business logic for uploaded PDF resumes.

    Coordinates PDF validation, Supabase Storage and the resume repository.
    Ownership always comes from the authenticated user's id supplied by the
    caller; no user id is ever taken from the request body or query string.
    """

    def __init__(
        self,
        repository: ResumeRepository,
        storage: S3StorageService | None = None,
    ) -> None:
        self.repository = repository
        self.storage = storage or S3StorageService()

    async def create_resume(
        self,
        user_id: str,
        file: UploadFile,
        title: str | None = None,
    ) -> ResumeResponse:
        data, file_name = await self._read_validated_pdf(file)
        resume_id = str(uuid4())
        storage_path = self.storage_path(user_id, resume_id)

        try:
            await self.storage.upload_bytes(storage_path, data, PDF_MIME_TYPE)
        except S3StorageError as exc:
            raise resume_storage_error() from exc

        try:
            resume = self.repository.create(
                resume_id=resume_id,
                user_id=user_id,
                title=self._resolve_title(title, file_name),
                file_name=file_name,
                storage_path=storage_path,
                mime_type=PDF_MIME_TYPE,
                file_size=len(data),
            )
        except Exception as exc:
            # Never leave an orphaned storage object behind.
            await self._delete_object_quietly(storage_path)
            logger.exception("Failed to persist resume metadata for user '%s'", user_id)
            raise resume_persistence_error() from exc

        return self._to_response(resume)

    def list_resumes(self, user_id: str) -> list[ResumeResponse]:
        return [self._to_response(resume) for resume in self.repository.list(user_id)]

    def get_resume(self, user_id: str, resume_id: str) -> ResumeResponse:
        return self._to_response(self._get_owned_resume(user_id, resume_id))

    async def update_resume(
        self,
        user_id: str,
        resume_id: str,
        file: UploadFile | None = None,
        title: str | None = None,
    ) -> ResumeResponse:
        resume = self._get_owned_resume(user_id, resume_id)

        new_title = title.strip() if title and title.strip() else None
        values: dict[str, Any] = {}

        if file is not None:
            data, file_name = await self._read_validated_pdf(file)
            try:
                # Same storage path, so the stored reference stays stable.
                await self.storage.upload_bytes(
                    resume.storage_path or "",
                    data,
                    PDF_MIME_TYPE,
                )
            except S3StorageError as exc:
                raise resume_storage_error() from exc
            values.update(
                file_name=file_name,
                mime_type=PDF_MIME_TYPE,
                file_size=len(data),
            )

        if new_title is not None:
            values["title"] = new_title

        if not values:
            raise resume_update_error()

        try:
            updated = self.repository.update(user_id, resume_id, values)
        except Exception as exc:
            logger.exception("Failed to update resume '%s'", resume_id)
            raise resume_persistence_error() from exc

        if updated is None:
            raise resume_not_found_error()

        return self._to_response(updated)

    async def delete_resume(self, user_id: str, resume_id: str) -> None:
        resume = self._get_owned_resume(user_id, resume_id)

        try:
            await self.storage.delete_object(resume.storage_path or "")
        except S3StorageError as exc:
            # The row is left in place, so the record never points at a deleted
            # object and the caller can simply retry the delete.
            raise resume_storage_error() from exc

        try:
            deleted = self.repository.delete(user_id, resume_id)
        except Exception as exc:
            logger.exception("Failed to delete resume record '%s'", resume_id)
            raise resume_persistence_error() from exc

        if not deleted:
            raise resume_not_found_error()

    @staticmethod
    def storage_path(user_id: str, resume_id: str) -> str:
        """Server generated, user scoped storage path."""
        return f"{user_id}/resumes/{resume_id}.pdf"

    def _get_owned_resume(self, user_id: str, resume_id: str) -> Resume:
        resume = self.repository.get(user_id, resume_id)
        if resume is None:
            raise resume_not_found_error()
        return resume

    async def _read_validated_pdf(self, file: UploadFile) -> tuple[bytes, str]:
        file_name = Path(file.filename or "").name.strip()
        if not file_name or Path(file_name).suffix.lower() != PDF_EXTENSION:
            raise invalid_resume_file_error("Resume file must be a PDF file (.pdf).")

        if (file.content_type or "").lower() != PDF_MIME_TYPE:
            raise invalid_resume_file_error(
                "Resume file must use the application/pdf content type."
            )

        max_bytes = settings.resume_max_file_size_bytes
        data = await file.read(max_bytes + 1)
        if len(data) > max_bytes:
            raise resume_file_too_large_error(max_bytes)

        if not data:
            raise invalid_resume_file_error("The uploaded resume file is empty.")

        if not data.startswith(PDF_SIGNATURE):
            raise invalid_resume_file_error(
                "The uploaded file is not a valid PDF document."
            )

        return data, file_name

    async def _delete_object_quietly(self, storage_path: str) -> None:
        try:
            await self.storage.delete_object(storage_path)
        except S3StorageError:
            logger.warning(
                "Orphaned storage object could not be removed: '%s'",
                storage_path,
            )

    @staticmethod
    def _resolve_title(title: str | None, file_name: str) -> str:
        if title and title.strip():
            return title.strip()
        return Path(file_name).stem or "Resume"

    def _to_response(self, resume: Resume) -> ResumeResponse:
        try:
            download_url = self.storage.generate_signed_url(
                resume.storage_path or ""
            )
        except S3StorageError as exc:
            raise resume_storage_error() from exc

        now = datetime.now(timezone.utc)
        created_at = resume.created_at or now

        return ResumeResponse(
            id=resume.id,
            title=resume.title,
            file_name=resume.file_name or "",
            file_size=resume.file_size or 0,
            mime_type=resume.mime_type or PDF_MIME_TYPE,
            created_at=created_at,
            updated_at=resume.updated_at or created_at,
            download_url=download_url,
        )
