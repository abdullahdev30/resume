import html
import json
import logging
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

import httpx
from fastapi import UploadFile

from app.core.config import settings
from app.integrations.s3_storage import S3StorageError, S3StorageService
from app.modules.resume.errors import (
    invalid_resume_file_error,
    resume_ai_error,
    resume_file_too_large_error,
    resume_not_editable_error,
    resume_not_found_error,
    resume_persistence_error,
    resume_storage_error,
    resume_update_error,
)
from app.modules.resume.models import Resume
from app.modules.resume.repository import ResumeRepository
from app.modules.resume.schemas import (
    AIResumeRequest,
    ResumeAIEditProposal,
    ResumeAIEditRequest,
    ResumePDFResponse,
    ResumeResponse,
    ResumeUpdateRequest,
    TemplateResumeRequest,
)

logger = logging.getLogger(__name__)

PDF_EXTENSION = ".pdf"
PDF_MIME_TYPE = "application/pdf"
PDF_SIGNATURE = b"%PDF-"
SAFE_TAG_RE = re.compile(
    r"<\s*/?\s*(script|iframe|object|embed|link|meta)[^>]*>",
    re.IGNORECASE,
)
EVENT_ATTR_RE = re.compile(
    r"\s+on[a-z]+\s*=\s*(['\"]).*?\1",
    re.IGNORECASE | re.DOTALL,
)
JS_URL_RE = re.compile(
    r"(href|src)\s*=\s*(['\"])\s*javascript:.*?\2",
    re.IGNORECASE | re.DOTALL,
)


class ResumeService:
    """Business logic for legacy PDF uploads and editable resume documents."""

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
        raw_html = request.html_content or self._render_resume_html(
            resume_data,
            request.template_id,
        )
        return await self._create_editable_resume(
            user_id=user_id,
            title=request.title,
            template_id=request.template_id,
            resume_data=resume_data,
            html_content=self._sanitize_html(raw_html),
            resume_type="template",
            is_ai_generated=False,
        )

    async def create_ai_resume(
        self,
        user_id: str,
        request: AIResumeRequest,
    ) -> ResumeResponse:
        proposal = await self._generate_ai_document(
            prompt=request.prompt,
            job_description=request.job_description,
            profile_context=request.profile_context or {},
            template_id=request.template_id or "1",
        )
        return await self._create_editable_resume(
            user_id=user_id,
            title=request.title,
            template_id=request.template_id or "1",
            resume_data=proposal.resume_data,
            html_content=proposal.html_content,
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
            or request.html_content is not None
            or request.template_id is not None
        ):
            if not self._is_editable(resume):
                raise resume_not_editable_error()

            resume_data = self._normalize_resume_data(request.resume_data or resume.data or {})
            template_id = request.template_id or resume.template_id or "1"
            raw_html = request.html_content or self._render_resume_html(
                resume_data,
                template_id,
            )
            html_content = self._sanitize_html(raw_html)
            pdf_bytes = self._generate_pdf_bytes(html_content, resume.title)

            try:
                await self.storage.upload_bytes(
                    resume.storage_path or self.storage_path(user_id, resume_id),
                    pdf_bytes,
                    PDF_MIME_TYPE,
                )
            except S3StorageError as exc:
                raise resume_storage_error() from exc

            values.update(
                template_id=template_id,
                data=resume_data,
                html_content=html_content,
                file_name=f"{self._safe_pdf_stem(values.get('title') or resume.title)}.pdf",
                mime_type=PDF_MIME_TYPE,
                file_size=len(pdf_bytes),
                source_version=(resume.source_version or 1) + 1,
            )

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

    async def create_ai_edit_proposal(
        self,
        user_id: str,
        resume_id: str,
        request: ResumeAIEditRequest,
    ) -> ResumeAIEditProposal:
        resume = self._get_owned_resume(user_id, resume_id)
        if not self._is_editable(resume):
            raise resume_not_editable_error()
        return await self._generate_ai_document(
            prompt=request.instruction,
            job_description=request.job_description,
            profile_context=resume.data or {},
            template_id=resume.template_id or "1",
            existing_data=resume.data or {},
        )

    async def regenerate_pdf(self, user_id: str, resume_id: str) -> ResumeResponse:
        resume = self._get_owned_resume(user_id, resume_id)
        if not self._is_editable(resume):
            raise resume_not_editable_error()

        html_content = self._sanitize_html(
            resume.html_content
            or self._render_resume_html(resume.data or {}, resume.template_id or "1")
        )
        pdf_bytes = self._generate_pdf_bytes(html_content, resume.title)

        try:
            await self.storage.upload_bytes(
                resume.storage_path or self.storage_path(user_id, resume_id),
                pdf_bytes,
                PDF_MIME_TYPE,
            )
            updated = self.repository.update(
                user_id,
                resume_id,
                {
                    "html_content": html_content,
                    "file_size": len(pdf_bytes),
                    "mime_type": PDF_MIME_TYPE,
                    "file_name": f"{self._safe_pdf_stem(resume.title)}.pdf",
                },
            )
        except S3StorageError as exc:
            raise resume_storage_error() from exc
        except Exception as exc:
            logger.exception("Failed to update regenerated PDF metadata '%s'", resume_id)
            raise resume_persistence_error() from exc

        if updated is None:
            raise resume_not_found_error()
        return self._to_response(updated)

    def get_pdf(self, user_id: str, resume_id: str) -> ResumePDFResponse:
        resume = self._get_owned_resume(user_id, resume_id)
        return ResumePDFResponse(download_url=self._signed_url(resume.storage_path or ""))

    async def delete_resume(self, user_id: str, resume_id: str) -> None:
        resume = self._get_owned_resume(user_id, resume_id)

        if resume.storage_path:
            try:
                await self.storage.delete_object(resume.storage_path)
            except S3StorageError as exc:
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
        return f"{user_id}/resumes/{resume_id}.pdf"

    async def _create_editable_resume(
        self,
        *,
        user_id: str,
        title: str,
        template_id: str | None,
        resume_data: dict[str, Any],
        html_content: str,
        resume_type: str,
        is_ai_generated: bool,
    ) -> ResumeResponse:
        resume_id = str(uuid4())
        storage_path = self.storage_path(user_id, resume_id)
        pdf_bytes = self._generate_pdf_bytes(html_content, title)

        try:
            await self.storage.upload_bytes(storage_path, pdf_bytes, PDF_MIME_TYPE)
        except S3StorageError as exc:
            raise resume_storage_error() from exc

        try:
            resume = self.repository.create_document(
                resume_id=resume_id,
                user_id=user_id,
                title=title.strip(),
                template_id=template_id,
                data=resume_data,
                html_content=html_content,
                storage_path=storage_path,
                file_name=f"{self._safe_pdf_stem(title)}.pdf",
                file_size=len(pdf_bytes),
                resume_type=resume_type,
                is_ai_generated=is_ai_generated,
            )
        except Exception as exc:
            await self._delete_object_quietly(storage_path)
            logger.exception("Failed to persist editable resume for user '%s'", user_id)
            raise resume_persistence_error() from exc

        return self._to_response(resume)

    async def _replace_uploaded_pdf(
        self,
        resume: Resume,
        file: UploadFile,
        title: str | None,
    ) -> ResumeResponse:
        data, file_name = await self._read_validated_pdf(file)
        try:
            await self.storage.upload_bytes(resume.storage_path or "", data, PDF_MIME_TYPE)
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
            logger.warning("Orphaned storage object could not be removed: '%s'", storage_path)

    async def _generate_ai_document(
        self,
        *,
        prompt: str,
        job_description: str | None,
        profile_context: dict[str, Any],
        template_id: str,
        existing_data: dict[str, Any] | None = None,
    ) -> ResumeAIEditProposal:
        if settings.openai_api_key:
            try:
                return await self._generate_with_openai(
                    prompt=prompt,
                    job_description=job_description,
                    profile_context=profile_context,
                    template_id=template_id,
                    existing_data=existing_data,
                )
            except Exception as exc:
                logger.exception("OpenAI resume generation failed")
                raise resume_ai_error() from exc

        resume_data = self._fallback_ai_resume_data(
            prompt=prompt,
            job_description=job_description,
            profile_context=profile_context,
            existing_data=existing_data,
        )
        return ResumeAIEditProposal(
            resume_data=resume_data,
            html_content=self._render_resume_html(resume_data, template_id),
        )

    async def _generate_with_openai(
        self,
        *,
        prompt: str,
        job_description: str | None,
        profile_context: dict[str, Any],
        template_id: str,
        existing_data: dict[str, Any] | None,
    ) -> ResumeAIEditProposal:
        input_payload = {
            "prompt": prompt,
            "job_description": job_description,
            "profile_context": profile_context,
            "existing_resume_data": existing_data,
        }
        instructions = (
            "Return JSON only with keys resume_data and html_content. "
            "Use only facts present in profile_context, existing_resume_data, "
            "prompt, or job_description. Do not invent employers, schools, "
            "dates, certificates, links, metrics, or degrees. Keep HTML safe: "
            "inline CSS only, no scripts, no external resources."
        )
        body = {
            "model": settings.openai_model,
            "input": f"{instructions}\n\n{json.dumps(input_payload, ensure_ascii=False)}",
        }
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(
                "https://api.openai.com/v1/responses",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json=body,
            )
            response.raise_for_status()
        text = self._extract_openai_text(response.json())
        parsed = json.loads(text)
        resume_data = self._normalize_resume_data(parsed.get("resume_data") or {})
        html_content = parsed.get("html_content") or self._render_resume_html(
            resume_data,
            template_id,
        )
        return ResumeAIEditProposal(
            resume_data=resume_data,
            html_content=self._sanitize_html(html_content),
        )

    @staticmethod
    def _extract_openai_text(payload: dict[str, Any]) -> str:
        if isinstance(payload.get("output_text"), str):
            return payload["output_text"]
        for item in payload.get("output", []):
            for content in item.get("content", []):
                if content.get("type") in {"output_text", "text"} and content.get("text"):
                    return content["text"]
        raise ValueError("OpenAI response did not include text output.")

    def _fallback_ai_resume_data(
        self,
        *,
        prompt: str,
        job_description: str | None,
        profile_context: dict[str, Any],
        existing_data: dict[str, Any] | None,
    ) -> dict[str, Any]:
        source = dict(existing_data or profile_context or {})
        full_name = (
            source.get("fullName")
            or source.get("full_name")
            or source.get("name")
            or "Your Name"
        )
        headline = source.get("jobTitle") or source.get("headline") or "Professional"
        summary_bits = [str(prompt).strip()]
        if job_description:
            summary_bits.append(f"Target role: {job_description[:260].strip()}")
        source.setdefault("fullName", full_name)
        source.setdefault("jobTitle", headline)
        source.setdefault("email", source.get("email", ""))
        source.setdefault("phone", source.get("phone", ""))
        source.setdefault("location", source.get("location") or source.get("city") or "")
        source.setdefault("summary", " ".join(bit for bit in summary_bits if bit))
        source.setdefault("skills", source.get("skills") or [])
        source.setdefault("languages", source.get("languages") or [])
        source.setdefault("experience", source.get("experience") or [])
        source.setdefault("education", source.get("education") or [])
        source.setdefault("primaryColor", source.get("primaryColor") or "#0E7C7B")
        return self._normalize_resume_data(source)

    @staticmethod
    def _normalize_resume_data(data: dict[str, Any]) -> dict[str, Any]:
        normalized = dict(data or {})
        normalized["skills"] = list(normalized.get("skills") or [])
        normalized["languages"] = list(normalized.get("languages") or [])
        normalized["experience"] = list(normalized.get("experience") or [])
        normalized["education"] = list(normalized.get("education") or [])
        return normalized

    def _render_resume_html(self, data: dict[str, Any], template_id: str | None) -> str:
        accent = html.escape(str(data.get("primaryColor") or "#0E7C7B"))
        name = html.escape(str(data.get("fullName") or data.get("name") or "Your Name"))
        title = html.escape(str(data.get("jobTitle") or "Professional"))
        contact = " | ".join(
            html.escape(str(value))
            for value in [data.get("email"), data.get("phone"), data.get("location")]
            if value
        )
        summary = html.escape(str(data.get("summary") or ""))
        skills = "".join(
            f"<span>{html.escape(str(skill))}</span>"
            for skill in data.get("skills", [])
            if str(skill).strip()
        )
        experience = "".join(
            self._render_experience_item(item)
            for item in data.get("experience", [])
            if isinstance(item, dict)
        )
        education = "".join(
            self._render_education_item(item)
            for item in data.get("education", [])
            if isinstance(item, dict)
        )
        return self._sanitize_html(
            f"""<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: Arial, sans-serif; color: #172033; margin: 0; }}
    .page {{ padding: 42px; max-width: 820px; margin: 0 auto; }}
    h1 {{ color: {accent}; margin: 0; font-size: 34px; }}
    h2 {{ color: {accent}; border-bottom: 2px solid {accent}; font-size: 15px; padding-bottom: 6px; margin-top: 26px; text-transform: uppercase; }}
    .title {{ font-weight: 700; margin-top: 6px; }}
    .contact {{ color: #5f6b7a; font-size: 13px; margin-top: 8px; }}
    p, li {{ font-size: 13px; line-height: 1.55; }}
    .skills span {{ display: inline-block; border: 1px solid {accent}; color: {accent}; padding: 5px 8px; margin: 4px; border-radius: 5px; font-size: 12px; }}
    .item {{ margin: 14px 0; }}
    .item strong {{ display: block; }}
    .period {{ color: #718096; font-size: 12px; }}
  </style>
</head>
<body>
  <main class="page" data-template="{html.escape(str(template_id or '1'))}">
    <h1>{name}</h1>
    <div class="title">{title}</div>
    <div class="contact">{contact}</div>
    <h2>Profile</h2>
    <p>{summary}</p>
    <h2>Skills</h2>
    <div class="skills">{skills}</div>
    <h2>Experience</h2>
    {experience or '<p>No experience added.</p>'}
    <h2>Education</h2>
    {education or '<p>No education added.</p>'}
  </main>
</body>
</html>"""
        )

    @staticmethod
    def _render_experience_item(item: dict[str, Any]) -> str:
        role = html.escape(str(item.get("role") or item.get("job_title") or "Role"))
        company = html.escape(str(item.get("company") or "Company"))
        period = html.escape(str(item.get("period") or ""))
        details = html.escape(str(item.get("details") or item.get("description") or ""))
        return f'<section class="item"><strong>{role} - {company}</strong><div class="period">{period}</div><p>{details}</p></section>'

    @staticmethod
    def _render_education_item(item: dict[str, Any]) -> str:
        degree = html.escape(str(item.get("degree") or item.get("field_of_study") or "Education"))
        institution = html.escape(str(item.get("institution") or "Institution"))
        period = html.escape(str(item.get("period") or ""))
        return f'<section class="item"><strong>{degree}</strong><div>{institution}</div><div class="period">{period}</div></section>'

    @staticmethod
    def _sanitize_html(value: str) -> str:
        sanitized = SAFE_TAG_RE.sub("", value or "")
        sanitized = EVENT_ATTR_RE.sub("", sanitized)
        sanitized = JS_URL_RE.sub(r'\1="#"', sanitized)
        return sanitized

    @staticmethod
    def _generate_pdf_bytes(html_content: str, title: str) -> bytes:
        try:
            from weasyprint import HTML  # type: ignore

            return HTML(string=html_content).write_pdf()
        except (ImportError, OSError, RuntimeError, TypeError, ValueError):
            return ResumeService._simple_pdf_bytes(
                ResumeService._plain_text(html_content) or title
            )

    @staticmethod
    def _plain_text(html_content: str) -> str:
        text = re.sub(r"<[^>]+>", " ", html_content)
        return html.unescape(re.sub(r"\s+", " ", text)).strip()

    @staticmethod
    def _simple_pdf_bytes(text: str) -> bytes:
        lines = [line[:95] for line in re.findall(r".{1,95}(?:\s+|$)", text[:3000])]
        content = ["BT", "/F1 11 Tf", "50 780 Td"]
        for index, line in enumerate(lines[:44]):
            safe = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
            if index:
                content.append("0 -16 Td")
            content.append(f"({safe}) Tj")
        content.append("ET")
        stream = "\n".join(content).encode("latin-1", errors="replace")
        objects = [
            b"<< /Type /Catalog /Pages 2 0 R >>",
            b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
            b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
            b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
        ]
        output = [b"%PDF-1.4\n"]
        offsets = [0]
        for number, obj in enumerate(objects, start=1):
            offsets.append(sum(len(part) for part in output))
            output.append(f"{number} 0 obj\n".encode() + obj + b"\nendobj\n")
        xref_offset = sum(len(part) for part in output)
        output.append(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode())
        for offset in offsets[1:]:
            output.append(f"{offset:010d} 00000 n \n".encode())
        output.append(
            f"trailer << /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode()
        )
        return b"".join(output)

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
        return bool(resume.data or resume.html_content or resume.resume_type in {"template", "ai"})

    def _signed_url(self, storage_path: str) -> str:
        try:
            return self.storage.generate_signed_url(storage_path)
        except S3StorageError as exc:
            raise resume_storage_error() from exc

    def _to_response(self, resume: Resume) -> ResumeResponse:
        now = datetime.now(timezone.utc)
        created_at = resume.created_at or now
        editable = self._is_editable(resume)
        resume_type = resume.resume_type or (
            "ai" if resume.is_ai_generated else "template" if editable else "legacy_pdf"
        )

        return ResumeResponse(
            id=resume.id,
            title=resume.title,
            resume_type=resume_type,
            editable=editable,
            template_id=resume.template_id,
            resume_data=resume.data if editable else None,
            html_content=resume.html_content if editable else None,
            file_name=resume.file_name or "",
            file_size=resume.file_size or 0,
            mime_type=resume.mime_type or PDF_MIME_TYPE,
            created_at=created_at,
            updated_at=resume.updated_at or created_at,
            download_url=self._signed_url(resume.storage_path or ""),
        )
