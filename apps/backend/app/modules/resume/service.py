import json
import logging
import re
from datetime import datetime, timezone
from pathlib import Path
from time import perf_counter
from typing import Any
from uuid import uuid4

import httpx
from fastapi import UploadFile
from pydantic import ValidationError
from starlette.concurrency import run_in_threadpool

from app.core.config import settings
from app.integrations.s3_storage import S3StorageError, S3StorageService
from app.modules.profile.errors import ProfileApplicationError
from app.modules.profile.service import ProfileService
from app.modules.resume.errors import (
    ResumeApplicationError,
    invalid_resume_file_error,
    resume_ai_error,
    resume_ai_invalid_output_error,
    resume_ai_not_configured_error,
    resume_ai_rate_limit_error,
    resume_ai_timeout_error,
    resume_file_too_large_error,
    resume_not_editable_error,
    resume_not_found_error,
    resume_pdf_unavailable_error,
    resume_persistence_error,
    resume_profile_required_error,
    resume_storage_error,
    resume_update_error,
    resume_version_conflict_error,
)
from app.modules.resume.models import Resume
from app.modules.resume.reference_fetcher import fetch_reference_texts
from app.modules.resume.repository import ResumeRepository
from app.modules.resume.schemas import (
    AIResumeDocument,
    AIResumeRequest,
    ResumeAIEditProposal,
    ResumeAIEditRequest,
    ResumeData,
    ResumePDFResponse,
    ResumeResponse,
    ResumeUpdateRequest,
    TemplateResumeRequest,
)

logger = logging.getLogger(__name__)

PDF_EXTENSION = ".pdf"
PDF_MIME_TYPE = "application/pdf"
PDF_SIGNATURE = b"%PDF-"


class ResumeService:
    """Business logic for legacy PDF uploads and editable resume documents."""

    def __init__(
        self,
        repository: ResumeRepository,
        storage: S3StorageService | None = None,
        profile_service: ProfileService | None = None,
    ) -> None:
        self.repository = repository
        self.storage = storage or S3StorageService()
        self.profile_service = profile_service

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
                resume_type="legacy_pdf",
                is_ai_generated=False,
            )
        except Exception as exc:
            await self._delete_object_quietly(storage_path)
            logger.exception("Failed to persist resume metadata for user '%s'", user_id)
            raise resume_persistence_error() from exc

        return self._to_response(resume)

    async def create_template_resume(
        self,
        user_id: str,
        request: TemplateResumeRequest,
    ) -> ResumeResponse:
        resume_data = self._normalize_resume_data(request.resume_data)
        return await self._create_editable_resume(
            user_id=user_id,
            title=request.title,
            template_id=request.template_id,
            resume_data=resume_data,
            resume_type="template",
            is_ai_generated=False,
        )

    async def create_ai_resume(
        self,
        user_id: str,
        request: AIResumeRequest,
    ) -> ResumeResponse:
        self._ensure_ai_configured()
        profile_context = await run_in_threadpool(
            self._profile_context,
            user_id,
            request.selected_sections,
        )
        proposal = await self._generate_ai_document(
            prompt=request.prompt,
            job_description=request.job_description,
            profile_context=profile_context,
            reference_links=request.reference_links,
        )
        return await self._create_editable_resume(
            user_id=user_id,
            title=request.title,
            template_id=proposal.template_id,
            resume_data=proposal.resume_data,
            resume_type="ai",
            is_ai_generated=True,
        )

    def list_resumes(self, user_id: str) -> list[ResumeResponse]:
        return [self._to_response(resume) for resume in self.repository.list(user_id)]

    def get_resume(self, user_id: str, resume_id: str) -> ResumeResponse:
        return self._to_response(self._get_owned_resume(user_id, resume_id))

    async def update_resume(
        self,
        user_id: str,
        resume_id: str,
        request: ResumeUpdateRequest | None = None,
        file: UploadFile | None = None,
        title: str | None = None,
    ) -> ResumeResponse:
        resume = self._get_owned_resume(user_id, resume_id)

        if file is not None:
            return await self._replace_uploaded_pdf(resume, file, title)

        values: dict[str, Any] = {}
        next_title = request.title if request else title
        if next_title and next_title.strip():
            values["title"] = next_title.strip()

        if request and (
            request.resume_data is not None
            or request.template_id is not None
        ):
            if not self._is_editable(resume):
                raise resume_not_editable_error()
            if request.source_version != (resume.source_version or 1):
                raise resume_version_conflict_error()

            resume_data = self._normalize_resume_data(
                request.resume_data or resume.data or {}
            )
            template_id = request.template_id or resume.template_id or "1"
            values.update(
                template_id=template_id,
                data=resume_data,
                source_version=(resume.source_version or 1) + 1,
            )

        if not values:
            raise resume_update_error()

        try:
            if request and "source_version" in values:
                updated = self.repository.update_if_source_version(
                    user_id,
                    resume_id,
                    request.source_version or 0,
                    values,
                )
                if updated is None:
                    raise resume_version_conflict_error()
            else:
                updated = self.repository.update(user_id, resume_id, values)
        except ResumeApplicationError:
            raise
        except Exception as exc:
            logger.exception("Failed to update resume '%s'", resume_id)
            raise resume_persistence_error() from exc

        if updated is None:
            raise resume_not_found_error()

        return self._to_response(updated)

    async def create_ai_edit_proposal(
        self,
        user_id: str,
        resume_id: str,
        request: ResumeAIEditRequest,
    ) -> ResumeAIEditProposal:
        resume = self._get_owned_resume(user_id, resume_id)
        if not self._is_editable(resume):
            raise resume_not_editable_error()
        self._ensure_ai_configured()
        profile_context = await run_in_threadpool(self._profile_context, user_id)
        return await self._generate_ai_document(
            prompt=request.instruction,
            job_description=request.job_description,
            profile_context=profile_context,
            reference_links=request.reference_links,
            existing_data=resume.data or {},
        )

    def get_pdf(self, user_id: str, resume_id: str) -> ResumePDFResponse:
        resume = self._get_owned_resume(user_id, resume_id)
        if not self._is_legacy_pdf(resume) or not resume.storage_path:
            raise resume_pdf_unavailable_error()
        return ResumePDFResponse(
            download_url=self._signed_url(
                resume.storage_path,
                resume.file_name or f"{self._safe_pdf_stem(resume.title)}.pdf",
            )
        )

    async def delete_resume(self, user_id: str, resume_id: str) -> None:
        resume = self._get_owned_resume(user_id, resume_id)
        legacy_storage_path = (
            resume.storage_path if self._is_legacy_pdf(resume) else None
        )

        try:
            deleted = self.repository.delete(user_id, resume_id)
        except Exception as exc:
            logger.exception("Failed to delete resume record '%s'", resume_id)
            raise resume_persistence_error() from exc

        if not deleted:
            raise resume_not_found_error()

        if legacy_storage_path:
            try:
                await self.storage.delete_object(legacy_storage_path)
            except S3StorageError as exc:
                logger.exception(
                    "Resume row deleted but storage cleanup failed path=%s",
                    legacy_storage_path,
                )
                try:
                    self.repository.enqueue_storage_cleanup(
                        storage_path=legacy_storage_path,
                        user_id=user_id,
                        last_error=str(exc),
                    )
                except Exception:
                    logger.exception(
                        "Failed to enqueue resume storage cleanup path=%s",
                        legacy_storage_path,
                    )

    @staticmethod
    def storage_path(user_id: str, resume_id: str) -> str:
        return f"{user_id}/resumes/{resume_id}.pdf"

    async def _create_editable_resume(
        self,
        *,
        user_id: str,
        title: str,
        template_id: str | None,
        resume_data: dict[str, Any],
        resume_type: str,
        is_ai_generated: bool,
    ) -> ResumeResponse:
        resume_id = str(uuid4())
        try:
            resume = self.repository.create_document(
                resume_id=resume_id,
                user_id=user_id,
                title=title.strip(),
                template_id=template_id,
                data=resume_data,
                resume_type=resume_type,
                is_ai_generated=is_ai_generated,
            )
        except Exception as exc:
            logger.exception("Failed to persist editable resume for user '%s'", user_id)
            raise resume_persistence_error() from exc
        return self._to_response(resume)

    async def _replace_uploaded_pdf(
        self,
        resume: Resume,
        file: UploadFile,
        title: str | None,
    ) -> ResumeResponse:
        if not self._is_legacy_pdf(resume) or not resume.storage_path:
            raise resume_pdf_unavailable_error()
        data, file_name = await self._read_validated_pdf(file)
        try:
            await self.storage.upload_bytes(resume.storage_path, data, PDF_MIME_TYPE)
        except S3StorageError as exc:
            raise resume_storage_error() from exc

        values: dict[str, Any] = {
            "file_name": file_name,
            "mime_type": PDF_MIME_TYPE,
            "file_size": len(data),
        }
        if title and title.strip():
            values["title"] = title.strip()

        try:
            updated = self.repository.update(resume.user_id, resume.id, values)
        except Exception as exc:
            logger.exception("Failed to replace PDF resume '%s'", resume.id)
            raise resume_persistence_error() from exc
        if updated is None:
            raise resume_not_found_error()
        return self._to_response(updated)

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
                "Orphaned storage object could not be removed: '%s'", storage_path
            )

    async def _generate_ai_document(
        self,
        *,
        prompt: str,
        job_description: str | None,
        profile_context: dict[str, Any],
        reference_links: list[str],
        existing_data: dict[str, Any] | None = None,
    ) -> ResumeAIEditProposal:
        self._ensure_ai_configured()
        try:
            document = await self._generate_with_ai_provider(
                prompt=prompt,
                job_description=job_description,
                profile_context=profile_context,
                reference_links=reference_links,
                existing_data=existing_data,
            )
        except ResumeApplicationError:
            raise
        except httpx.TimeoutException as exc:
            raise resume_ai_timeout_error() from exc
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 429:
                raise resume_ai_rate_limit_error() from exc
            logger.warning("AI provider returned HTTP %s", exc.response.status_code)
            raise resume_ai_error() from exc
        except Exception as exc:
            logger.exception("AI resume generation failed")
            raise resume_ai_error() from exc
        resume_data, template_id = document.to_storage()
        return ResumeAIEditProposal(resume_data=resume_data, template_id=template_id)

    async def _generate_with_ai_provider(
        self,
        *,
        prompt: str,
        job_description: str | None,
        profile_context: dict[str, Any],
        reference_links: list[str],
        existing_data: dict[str, Any] | None,
    ) -> AIResumeDocument:
        reference_context = await fetch_reference_texts(reference_links)
        input_payload = {
            "prompt": prompt,
            "job_description": job_description,
            "profile_context": profile_context,
            "reference_links": reference_links,
            "reference_content": reference_context,
            "existing_resume_data": existing_data,
        }
        instructions = (
            "You are a resume editor and art director. Return only JSON matching the supplied "
            "AIResumeDocument schema with separate data and design objects. "
            "Use facts only from profile_context, existing_resume_data, the user's prompt, "
            "job_description, and reference_links. Never invent an employer, school, role, "
            "date, credential, project, URL, metric, degree, skill, or language. You may "
            "reorganize and rewrite supplied facts for clarity. When existing_resume_data is "
            "present, preserve manual edits unless the instruction explicitly changes them. "
            "Use empty strings or arrays when information is unavailable. Pick template_id 1-6 "
            "and a high-contrast palette appropriate to the job and seniority: conservative for "
            "finance/legal/executive work and modern for technology/design work. Prefer a one-page "
            "structure when the supplied content is short. Never output HTML or CSS."
        )
        schema = self._strict_json_schema(AIResumeDocument.model_json_schema(by_alias=True))
        last_validation_error: Exception | None = None
        provider = settings.ai_provider.lower()
        endpoint = (
            f"{settings.ai_base_url.rstrip('/')}/responses"
            if provider == "openai"
            else f"{settings.ai_base_url.rstrip('/')}/chat/completions"
        )
        async with httpx.AsyncClient(timeout=settings.ai_timeout_seconds) as client:
            for attempt in range(2):
                retry_note = (
                    "\nThe prior response failed schema validation. Correct it exactly."
                    if attempt
                    else ""
                )
                request_text = (
                    f"{instructions}{retry_note}\n\n"
                    f"{json.dumps(input_payload, ensure_ascii=False)}"
                )
                body = self._ai_request_body(provider, request_text, schema)
                started = perf_counter()
                logger.info(
                    "AI request started provider=%s model=%s base_url=%s attempt=%d",
                    provider,
                    settings.ai_model,
                    settings.ai_base_url,
                    attempt + 1,
                )
                response = await client.post(
                    endpoint,
                    headers={
                        "Authorization": f"Bearer {settings.ai_api_key}",
                        "Content-Type": "application/json",
                    },
                    json=body,
                )
                duration_ms = round((perf_counter() - started) * 1000)
                snippet = response.text[:500].replace("\n", " ")
                logger.info(
                    "AI response received provider=%s model=%s status=%d duration_ms=%d",
                    provider,
                    settings.ai_model,
                    response.status_code,
                    duration_ms,
                )
                logger.debug("AI response snippet=%s", snippet)
                if response.status_code >= 400:
                    logger.error(
                        "AI provider error provider=%s model=%s status=%d duration_ms=%d body=%s",
                        provider,
                        settings.ai_model,
                        response.status_code,
                        duration_ms,
                        snippet,
                    )
                response.raise_for_status()
                try:
                    payload = response.json()
                    text = (
                        self._extract_openai_text(payload)
                        if provider == "openai"
                        else self._extract_chat_completion_text(payload)
                    )
                    parsed = json.loads(self._strip_json_fence(text))
                    return AIResumeDocument.model_validate(parsed)
                except (
                    json.JSONDecodeError,
                    TypeError,
                    ValidationError,
                    ValueError,
                ) as exc:
                    last_validation_error = exc
                    logger.warning(
                        "AI resume output failed validation attempt=%d error=%s",
                        attempt + 1,
                        exc,
                    )

        raise resume_ai_invalid_output_error() from last_validation_error

    @staticmethod
    def _ai_request_body(
        provider: str,
        request_text: str,
        schema: dict[str, Any],
    ) -> dict[str, Any]:
        if provider == "openai-compatible":
            return {
                "model": settings.ai_model,
                "messages": [
                    {"role": "system", "content": "Return only the requested resume JSON."},
                    {"role": "user", "content": request_text},
                ],
                "response_format": {
                    "type": "json_schema",
                    "json_schema": {
                        "name": "resume_document",
                        "strict": True,
                        "schema": schema,
                    },
                },
            }
        return {
            "model": settings.ai_model,
            "input": request_text,
            "text": {
                "format": {
                    "type": "json_schema",
                    "name": "resume_document",
                    "strict": True,
                    "schema": schema,
                }
            },
        }

    @classmethod
    def _strict_json_schema(cls, schema: dict[str, Any]) -> dict[str, Any]:
        next_schema = dict(schema)
        # Structured Outputs does not support Pydantic defaults or arbitrary
        # string-keyed maps. Element styles are intentionally empty in the AI
        # contract; users can still create per-element styles in the editor.
        next_schema.pop("default", None)
        properties = next_schema.get("properties")
        if isinstance(properties, dict):
            next_schema["required"] = list(properties)
            next_schema["additionalProperties"] = False
            next_schema["properties"] = {
                key: cls._strict_json_schema(value)
                if isinstance(value, dict)
                else value
                for key, value in properties.items()
            }
        if isinstance(next_schema.get("additionalProperties"), dict):
            next_schema["additionalProperties"] = False
            next_schema["properties"] = {}
            next_schema["required"] = []
        if isinstance(next_schema.get("items"), dict):
            next_schema["items"] = cls._strict_json_schema(next_schema["items"])
        if isinstance(next_schema.get("$defs"), dict):
            next_schema["$defs"] = {
                key: cls._strict_json_schema(value)
                if isinstance(value, dict)
                else value
                for key, value in next_schema["$defs"].items()
            }
        for keyword in ("anyOf", "oneOf", "allOf"):
            if isinstance(next_schema.get(keyword), list):
                next_schema[keyword] = [
                    cls._strict_json_schema(value) if isinstance(value, dict) else value
                    for value in next_schema[keyword]
                ]
        return next_schema

    @staticmethod
    def _extract_openai_text(payload: dict[str, Any]) -> str:
        if isinstance(payload.get("output_text"), str):
            return payload["output_text"]
        for item in payload.get("output", []):
            for content in item.get("content", []):
                if content.get("type") in {"output_text", "text"} and content.get(
                    "text"
                ):
                    return content["text"]
        raise ValueError("OpenAI response did not include text output.")

    @staticmethod
    def _extract_chat_completion_text(payload: dict[str, Any]) -> str:
        choices = payload.get("choices") or []
        if choices and isinstance(choices[0], dict):
            content = (choices[0].get("message") or {}).get("content")
            if isinstance(content, str) and content:
                return content
        raise ValueError("Compatible provider response did not include message content.")

    @staticmethod
    def _strip_json_fence(value: str) -> str:
        stripped = value.strip()
        if stripped.startswith("```"):
            stripped = re.sub(r"^```(?:json)?\s*", "", stripped, flags=re.IGNORECASE)
            stripped = re.sub(r"\s*```$", "", stripped)
        return stripped

    @staticmethod
    def _ensure_ai_configured() -> None:
        if (
            not settings.ai_api_key
            or settings.ai_provider.lower() not in {"openai", "openai-compatible"}
            or not settings.ai_base_url.strip()
        ):
            raise resume_ai_not_configured_error()

    def _profile_context(
        self,
        user_id: str,
        selected_sections: list[str] | None = None,
    ) -> dict[str, Any]:
        if self.profile_service is None:
            self.profile_service = ProfileService()
        try:
            profile = self.profile_service.get_profile(user_id).model_dump(mode="json")
        except ProfileApplicationError as exc:
            raise resume_profile_required_error() from exc
        if selected_sections is None:
            return profile

        selected = set(selected_sections)
        context: dict[str, Any] = {}
        if "personal" in selected:
            context["personal"] = {
                key: value
                for key, value in profile["personal"].items()
                if key != "summary"
            }
        if "summary" in selected:
            context["summary"] = profile["personal"].get("summary")
        if "education" in selected:
            context["education"] = profile["education"]
        if "experience" in selected:
            context["experience"] = profile["experience"]
        if "skills" in selected:
            context["skills"] = [
                item
                for item in profile["skills"]
                if str(item.get("category") or "").casefold() != "language"
            ]
        if "languages" in selected:
            context["languages"] = [
                item
                for item in profile["skills"]
                if str(item.get("category") or "").casefold() == "language"
            ]
        if "certificates" in selected:
            context["certificates"] = profile["certificates"]
        if "projects" in selected:
            context["projects"] = profile["projects"]
        if "social_links" in selected:
            context["social_links"] = profile["social_links"]
        return context

    @staticmethod
    def _normalize_resume_data(data: dict[str, Any] | ResumeData) -> dict[str, Any]:
        if isinstance(data, ResumeData):
            return data.to_storage()
        return ResumeData.model_validate(data or {}).to_storage()

    @staticmethod
    def _resolve_title(title: str | None, file_name: str) -> str:
        if title and title.strip():
            return title.strip()
        return Path(file_name).stem or "Resume"

    @staticmethod
    def _safe_pdf_stem(title: str) -> str:
        stem = re.sub(r"[^a-zA-Z0-9_-]+", "-", title.strip()).strip("-")
        return stem[:80] or "resume"

    @staticmethod
    def _is_editable(resume: Resume) -> bool:
        return bool(
            resume.data
            and (
                resume.resume_type in {"template", "ai"}
                or resume.template_id in {"1", "2", "3", "4", "5", "6"}
            )
        )

    @classmethod
    def _is_legacy_pdf(cls, resume: Resume) -> bool:
        return bool(
            resume.resume_type == "legacy_pdf"
            or (not cls._is_editable(resume) and resume.storage_path)
        )

    def _signed_url(self, storage_path: str, file_name: str | None = None) -> str:
        try:
            return self.storage.generate_signed_url(storage_path, download_name=file_name)
        except S3StorageError as exc:
            raise resume_storage_error() from exc

    def _to_response(self, resume: Resume) -> ResumeResponse:
        now = datetime.now(timezone.utc)
        created_at = resume.created_at or now
        editable = self._is_editable(resume)
        resume_type = resume.resume_type or (
            "ai" if resume.is_ai_generated else "template" if editable else "legacy_pdf"
        )
        legacy_pdf = self._is_legacy_pdf(resume)
        download_url = (
            self._signed_url(
                resume.storage_path,
                resume.file_name or f"{self._safe_pdf_stem(resume.title)}.pdf",
            )
            if legacy_pdf and resume.storage_path
            else None
        )

        return ResumeResponse(
            id=resume.id,
            title=resume.title,
            resume_type=resume_type,
            editable=editable,
            template_id=resume.template_id,
            resume_data=resume.data if editable else None,
            file_name=resume.file_name if legacy_pdf else None,
            file_size=resume.file_size if legacy_pdf else None,
            mime_type=resume.mime_type if legacy_pdf else None,
            created_at=created_at,
            updated_at=resume.updated_at or created_at,
            download_url=download_url,
            source_version=resume.source_version or 1,
        )
