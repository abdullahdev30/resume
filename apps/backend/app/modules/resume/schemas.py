from datetime import datetime

from pydantic import BaseModel


class ResumeResponse(BaseModel):
    """Public representation of an uploaded PDF resume."""

    id: str
    title: str
    file_name: str
    file_size: int
    mime_type: str
    created_at: datetime
    updated_at: datetime
    download_url: str


class ResumeListResponse(BaseModel):
    resumes: list[ResumeResponse]


class ResumeMessageResponse(BaseModel):
    message: str
