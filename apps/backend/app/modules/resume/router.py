# backend/app/modules/resume/router.py
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.modules.auth.dependencies import CURRENT_USER_DEPENDENCY
from app.modules.auth.schemas import UserResponse
from app.modules.resume.errors import ResumeApplicationError, raise_resume_error
from app.modules.resume.repository import ResumeRepository
from app.modules.resume.schemas import (
    ResumeListResponse,
    ResumeMessageResponse,
    ResumeResponse,
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
    summary="Upload a PDF resume",
    description=(
        "Uploads a PDF resume for the authenticated user. The file is stored in "
        "the private Supabase Storage bucket as "
        "`{user_id}/resumes/{resume_id}.pdf` and its metadata is saved in "
        "`public.resumes`."
    ),
)
async def create_resume(
    file: Annotated[
        UploadFile,
        File(description="PDF file (max 10 MB by default)."),
    ],
    title: Annotated[
        str | None,
        Form(description="User facing resume title. Defaults to the file name."),
    ] = None,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
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


@router.get(
    "",
    response_model=ResumeListResponse,
    summary="List the authenticated user's resumes",
    description="Returns only the resumes owned by the authenticated user.",
)
def list_resumes(
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
    resume_service: ResumeService = RESUME_SERVICE_DEPENDENCY,
) -> ResumeListResponse:
    try:
        return ResumeListResponse(
            resumes=resume_service.list_resumes(user_id=current_user.id),
        )
    except ResumeApplicationError as exc:
        raise_resume_error(exc)
        raise RuntimeError("unreachable")


@router.get(
    "/{resume_id}",
    response_model=ResumeResponse,
    summary="Get a single resume",
    description=(
        "Returns the resume metadata plus a short-lived signed download URL. "
        "The storage bucket stays private."
    ),
)
def get_resume(
    resume_id: UUID,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
    resume_service: ResumeService = RESUME_SERVICE_DEPENDENCY,
) -> ResumeResponse:
    try:
        return resume_service.get_resume(
            user_id=current_user.id,
            resume_id=str(resume_id),
        )
    except ResumeApplicationError as exc:
        raise_resume_error(exc)
        raise RuntimeError("unreachable")


@router.put(
    "/{resume_id}",
    response_model=ResumeResponse,
    summary="Update a resume",
    description=(
        "Replaces the stored PDF, the title, or both. Send only `title` to "
        "rename a resume, only `file` to replace the PDF, or both at once."
    ),
)
async def update_resume(
    resume_id: UUID,
    file: Annotated[
        UploadFile | None,
        File(description="Replacement PDF file (optional)."),
    ] = None,
    title: Annotated[
        str | None,
        Form(description="New resume title (optional)."),
    ] = None,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
    resume_service: ResumeService = RESUME_SERVICE_DEPENDENCY,
) -> ResumeResponse:
    try:
        return await resume_service.update_resume(
            user_id=current_user.id,
            resume_id=str(resume_id),
            file=file,
            title=title,
        )
    except ResumeApplicationError as exc:
        raise_resume_error(exc)
        raise RuntimeError("unreachable")


@router.delete(
    "/{resume_id}",
    response_model=ResumeMessageResponse,
    summary="Delete a resume",
    description=(
        "Deletes the stored PDF first and then the database record, so a failed "
        "database delete can be retried without losing track of the object."
    ),
)
async def delete_resume(
    resume_id: UUID,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
    resume_service: ResumeService = RESUME_SERVICE_DEPENDENCY,
) -> ResumeMessageResponse:
    try:
        await resume_service.delete_resume(
            user_id=current_user.id,
            resume_id=str(resume_id),
        )
    except ResumeApplicationError as exc:
        raise_resume_error(exc)
        raise RuntimeError("unreachable")
    return ResumeMessageResponse(message="Resume deleted successfully.")
