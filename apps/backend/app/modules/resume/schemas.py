from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

ResumeKind = Literal["template", "ai", "legacy_pdf"]


class TemplateResumeRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    template_id: str = Field(min_length=1, max_length=255)
    resume_data: dict[str, Any] = Field(default_factory=dict)
    html_content: str | None = Field(default=None, max_length=250_000)


class AIResumeRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    template_id: str | None = Field(default="1", max_length=255)
    prompt: str = Field(min_length=1, max_length=10_000)
    job_description: str | None = Field(default=None, max_length=20_000)
    profile_context: dict[str, Any] | None = None


class ResumeUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    template_id: str | None = Field(default=None, max_length=255)
    resume_data: dict[str, Any] | None = None
    html_content: str | None = Field(default=None, max_length=250_000)


class ResumeAIEditRequest(BaseModel):
    instruction: str = Field(min_length=1, max_length=10_000)
    job_description: str | None = Field(default=None, max_length=20_000)


class ResumeAIEditProposal(BaseModel):
    resume_data: dict[str, Any]
    html_content: str


class ResumePDFResponse(BaseModel):
    download_url: str


class ResumeResponse(BaseModel):
    id: str
    title: str
    resume_type: ResumeKind
    editable: bool
    template_id: str | None = None
    resume_data: dict[str, Any] | None = None
    html_content: str | None = None
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
