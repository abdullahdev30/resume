# backend/app/modules/resume/router.py
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.connection import get_db
from app.modules.auth.dependencies import (
    CURRENT_REGISTERED_USER_DEPENDENCY,
    CURRENT_USER_DEPENDENCY,
)
from app.modules.auth.router import limiter
from app.modules.auth.schemas import UserResponse
from app.modules.resume.errors import ResumeApplicationError, raise_resume_error
from app.modules.resume.repository import ResumeRepository
from app.modules.resume.schemas import (
    AIResumeRequest,
    ResumeAIEditProposal,
    ResumeAIEditRequest,
    ResumeListResponse,
    ResumeMessageResponse,
    ResumePDFResponse,
    ResumeResponse,
    ResumeUpdateRequest,
    TemplateResumeRequest,
)
from app.modules.resume.service import ResumeService

router = APIRouter(prefix="/resumes", tags=["Resumes"])


def get_resume_service(
    db: Annotated[Session, Depends(get_db)],
) -> ResumeService:
    return ResumeService(repository=ResumeRepository(db))


RESUME_SERVICE_DEPENDENCY = Depends(get_resume_service)


@router.post(
    "",
    response_model=ResumeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a legacy PDF resume",
)
async def create_resume(
    file: Annotated[UploadFile, File(description="PDF file (max 10 MB by default).")],
    title: Annotated[str | None, Form(description="Resume title.")] = None,
    current_user: UserResponse = CURRENT_REGISTERED_USER_DEPENDENCY,
    resume_service: ResumeService = RESUME_SERVICE_DEPENDENCY,
) -> ResumeResponse:
    try:
        return await resume_service.create_resume(
            user_id=current_user.id,
            file=file,
            title=title,
        )
    except ResumeApplicationError as exc:
        raise_resume_error(exc)
        raise RuntimeError("unreachable")


@router.post(
    "/template",
    response_model=ResumeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an editable template resume",
)
async def create_template_resume(
    request: TemplateResumeRequest,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
    resume_service: ResumeService = RESUME_SERVICE_DEPENDENCY,
) -> ResumeResponse:
    try:
        return await resume_service.create_template_resume(current_user.id, request)
    except ResumeApplicationError as exc:
        raise_resume_error(exc)
        raise RuntimeError("unreachable")


@router.post(
    "/ai",
    response_model=ResumeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an AI generated editable resume",
)
@limiter.limit(f"{settings.ai_rate_limit_per_hour}/hour")
async def create_ai_resume(
    request: Request,
    payload: AIResumeRequest,
    current_user: UserResponse = CURRENT_REGISTERED_USER_DEPENDENCY,
    resume_service: ResumeService = RESUME_SERVICE_DEPENDENCY,
) -> ResumeResponse:
    try:
        return await resume_service.create_ai_resume(current_user.id, payload)
    except ResumeApplicationError as exc:
        raise_resume_error(exc)
        raise RuntimeError("unreachable")


@router.get(
    "",
    response_model=ResumeListResponse,
    summary="List the authenticated user's resumes",
)
def list_resumes(
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
    resume_service: ResumeService = RESUME_SERVICE_DEPENDENCY,
) -> ResumeListResponse:
    try:
        return ResumeListResponse(resumes=resume_service.list_resumes(current_user.id))
    except ResumeApplicationError as exc:
        raise_resume_error(exc)
        raise RuntimeError("unreachable")


@router.get("/{resume_id}", response_model=ResumeResponse, summary="Get a resume")
def get_resume(
    resume_id: UUID,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
    resume_service: ResumeService = RESUME_SERVICE_DEPENDENCY,
) -> ResumeResponse:
    try:
        return resume_service.get_resume(current_user.id, str(resume_id))
    except ResumeApplicationError as exc:
        raise_resume_error(exc)
        raise RuntimeError("unreachable")


@router.put("/{resume_id}", response_model=ResumeResponse, summary="Update a resume")
async def update_resume(
    resume_id: UUID,
    request: Request,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
    resume_service: ResumeService = RESUME_SERVICE_DEPENDENCY,
) -> ResumeResponse:
    try:
        content_type = request.headers.get("content-type", "")
        if (
            "multipart/form-data" in content_type
            or "application/x-www-form-urlencoded" in content_type
        ):
            form = await request.form()
            file_value = form.get("file")
            title_value = form.get("title")
            file = file_value if hasattr(file_value, "read") else None
            title = str(title_value) if title_value is not None else None
            return await resume_service.update_resume(
                user_id=current_user.id,
                resume_id=str(resume_id),
                file=file,
                title=title,
            )

        try:
            payload = await request.json()
        except ValueError:
            payload = {}
        return await resume_service.update_resume(
            user_id=current_user.id,
            resume_id=str(resume_id),
            request=ResumeUpdateRequest.model_validate(payload),
        )
    except ResumeApplicationError as exc:
        raise_resume_error(exc)
        raise RuntimeError("unreachable")


@router.post(
    "/{resume_id}/ai-edit",
    response_model=ResumeAIEditProposal,
    summary="Create an AI edit proposal without saving it",
)
@limiter.limit("10/hour")
async def create_ai_edit_proposal(
    resume_id: UUID,
    request: Request,
    payload: ResumeAIEditRequest,
    current_user: UserResponse = CURRENT_REGISTERED_USER_DEPENDENCY,
    resume_service: ResumeService = RESUME_SERVICE_DEPENDENCY,
) -> ResumeAIEditProposal:
    try:
        return await resume_service.create_ai_edit_proposal(
            current_user.id,
            str(resume_id),
            payload,
        )
    except ResumeApplicationError as exc:
        raise_resume_error(exc)
        raise RuntimeError("unreachable")


@router.get(
    "/{resume_id}/pdf",
    response_model=ResumePDFResponse,
    summary="Get a signed download URL for a legacy uploaded PDF",
)
def get_resume_pdf(
    resume_id: UUID,
    current_user: UserResponse = CURRENT_REGISTERED_USER_DEPENDENCY,
    resume_service: ResumeService = RESUME_SERVICE_DEPENDENCY,
) -> ResumePDFResponse:
    try:
        return resume_service.get_pdf(current_user.id, str(resume_id))
    except ResumeApplicationError as exc:
        raise_resume_error(exc)
        raise RuntimeError("unreachable")


@router.delete(
    "/{resume_id}", response_model=ResumeMessageResponse, summary="Delete a resume"
)
async def delete_resume(
    resume_id: UUID,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
    resume_service: ResumeService = RESUME_SERVICE_DEPENDENCY,
) -> ResumeMessageResponse:
    try:
        await resume_service.delete_resume(current_user.id, str(resume_id))
    except ResumeApplicationError as exc:
        raise_resume_error(exc)
        raise RuntimeError("unreachable")
    return ResumeMessageResponse(message="Resume deleted successfully.")
