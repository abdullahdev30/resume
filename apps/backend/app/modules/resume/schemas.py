from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

ResumeKind = Literal["template", "ai", "legacy_pdf"]
ResumePageSize = Literal["A4", "Letter", "Legal", "A5", "B5", "Tabloid"]
TemplateId = Literal["1", "2", "3", "4", "5", "6"]
EditorTemplateId = TemplateId
ResumeSection = Literal[
    "personal",
    "summary",
    "skills",
    "experience",
    "education",
    "projects",
    "certificates",
    "languages",
    "social_links",
]
ResumeDesignSection = Literal[
    "summary",
    "experience",
    "skills",
    "education",
    "projects",
    "certificates",
    "languages",
    "social_links",
]
ResumeFontFamily = Literal[
    "Inter, sans-serif",
    "Georgia, serif",
    "Bricolage Grotesque, sans-serif",
]


class ResumeSchema(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True, extra="forbid", str_strip_whitespace=True
    )


class ResumeElementStyle(ResumeSchema):
    is_bold: bool | None = Field(default=None, alias="isBold")
    is_italic: bool | None = Field(default=None, alias="isItalic")
    is_underline: bool | None = Field(default=None, alias="isUnderline")
    align: Literal["left", "center", "right"] | None = None
    color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    font_size: float | None = Field(default=None, alias="fontSize", ge=6, le=96)
    line_height: float | None = Field(default=None, alias="lineHeight", ge=0.8, le=3)
    font_family: str | None = Field(default=None, alias="fontFamily", max_length=100)


class ResumeExperienceItem(ResumeSchema):
    id: str | None = Field(default=None, max_length=255)
    role: str = Field(default="", max_length=255)
    company: str = Field(default="", max_length=255)
    period: str = Field(default="", max_length=255)
    details: str = Field(default="", max_length=5000)


class ResumeEducationItem(ResumeSchema):
    id: str | None = Field(default=None, max_length=255)
    degree: str = Field(default="", max_length=255)
    institution: str = Field(default="", max_length=255)
    period: str = Field(default="", max_length=255)
    grade: str | None = Field(default=None, max_length=100)


class ResumeSocialLinkItem(ResumeSchema):
    id: str | None = Field(default=None, max_length=255)
    platform: str = Field(min_length=1, max_length=50)
    url: str = Field(min_length=1, max_length=2048)

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        if not value.lower().startswith(("https://", "http://")):
            raise ValueError("Reference links must use http or https.")
        return value


class ResumeProjectItem(ResumeSchema):
    id: str | None = Field(default=None, max_length=255)
    name: str = Field(min_length=1, max_length=255)
    description: str = Field(default="", max_length=5000)
    url: str | None = Field(default=None, max_length=2048)
    technologies: list[str] = Field(default_factory=list, max_length=100)


class ResumeCertificateItem(ResumeSchema):
    id: str | None = Field(default=None, max_length=255)
    title: str = Field(min_length=1, max_length=255)
    issuer: str = Field(default="", max_length=255)
    date: str = Field(default="", max_length=100)
    url: str | None = Field(default=None, max_length=2048)


class ResumeData(ResumeSchema):
    full_name: str = Field(default="", alias="fullName", max_length=255)
    job_title: str = Field(default="", alias="jobTitle", max_length=255)
    email: str = Field(default="", max_length=320)
    phone: str = Field(default="", max_length=50)
    location: str = Field(default="", max_length=1000)
    avatar_url: str | None = Field(
        default=None, alias="avatarUrl", max_length=2_000_000
    )
    summary: str = Field(default="", max_length=10_000)
    primary_color: str = Field(
        default="#0E7C7B", alias="primaryColor", pattern=r"^#[0-9a-fA-F]{6}$"
    )
    secondary_color: str = Field(
        default="#0f172a", alias="secondaryColor", pattern=r"^#[0-9a-fA-F]{6}$"
    )
    font_family: ResumeFontFamily = Field(
        default="Inter, sans-serif", alias="fontFamily"
    )
    font_scale: float = Field(default=1.0, alias="fontScale", ge=0.85, le=1.15)
    is_bold: bool | None = Field(default=None, alias="isBold")
    is_italic: bool | None = Field(default=None, alias="isItalic")
    is_underline: bool | None = Field(default=None, alias="isUnderline")
    text_align: Literal["left", "center", "right"] | None = Field(
        default=None, alias="textAlign"
    )
    skills: list[str] = Field(default_factory=list, max_length=200)
    languages: list[str] = Field(default_factory=list, max_length=100)
    experience: list[ResumeExperienceItem] = Field(default_factory=list, max_length=100)
    education: list[ResumeEducationItem] = Field(default_factory=list, max_length=100)
    social_links: list[ResumeSocialLinkItem] = Field(
        default_factory=list, alias="socialLinks", max_length=100
    )
    projects: list[ResumeProjectItem] = Field(default_factory=list, max_length=100)
    certificates: list[ResumeCertificateItem] = Field(
        default_factory=list, max_length=100
    )
    element_styles: dict[str, ResumeElementStyle] = Field(
        default_factory=dict, alias="elementStyles"
    )
    page_size: ResumePageSize = Field(default="A4", alias="pageSize")
    page_margin: float = Field(default=10, alias="pageMargin", ge=5, le=40)
    line_spacing: float = Field(default=1.15, alias="lineSpacing", ge=0.8, le=3)
    section_order: list[ResumeDesignSection] = Field(
        default_factory=lambda: [
            "summary",
            "experience",
            "skills",
            "education",
            "projects",
            "certificates",
            "languages",
        ],
        alias="sectionOrder",
        max_length=8,
    )

    @field_validator("skills", "languages")
    @classmethod
    def unique_strings(cls, values: list[str]) -> list[str]:
        result: list[str] = []
        seen: set[str] = set()
        for value in values:
            normalized = value.strip()
            key = normalized.casefold()
            if normalized and key not in seen:
                seen.add(key)
                result.append(normalized)
        return result

    @field_validator("section_order")
    @classmethod
    def unique_sections(cls, values: list[ResumeDesignSection]) -> list[ResumeDesignSection]:
        return list(dict.fromkeys(values))

    def to_storage(self) -> dict:
        return self.model_dump(mode="json", by_alias=True, exclude_none=True)


class TemplateResumeRequest(ResumeSchema):
    title: str = Field(min_length=1, max_length=255)
    template_id: TemplateId
    resume_data: ResumeData = Field(default_factory=ResumeData)


class AIResumeRequest(ResumeSchema):
    title: str = Field(min_length=1, max_length=255)
    prompt: str = Field(min_length=1, max_length=10_000)
    job_description: str | None = Field(default=None, max_length=20_000)
    reference_links: list[str] = Field(default_factory=list, max_length=20)
    selected_sections: list[ResumeSection] | None = None

    @field_validator("reference_links")
    @classmethod
    def validate_reference_links(cls, values: list[str]) -> list[str]:
        result: list[str] = []
        for value in values:
            normalized = value.strip()
            if not normalized.lower().startswith(("https://", "http://")):
                raise ValueError("Reference links must use http or https.")
            if len(normalized) > 2048:
                raise ValueError("Reference links must be 2048 characters or fewer.")
            if normalized not in result:
                result.append(normalized)
        return result


class AIResumeDesign(ResumeSchema):
    template_id: int = Field(ge=1, le=6)
    primary_color: str = Field(alias="primaryColor", pattern=r"^#[0-9a-fA-F]{6}$")
    secondary_color: str = Field(alias="secondaryColor", pattern=r"^#[0-9a-fA-F]{6}$")
    font_family: ResumeFontFamily = Field(alias="fontFamily")
    font_scale: float = Field(alias="fontScale", ge=0.85, le=1.15)
    line_spacing: float = Field(alias="lineSpacing", ge=1.0, le=2.0)
    page_margin: float = Field(alias="pageMargin", ge=10, le=30)
    section_order: list[ResumeDesignSection] = Field(alias="sectionOrder", min_length=1, max_length=8)
    element_styles: dict[str, ResumeElementStyle] = Field(alias="elementStyles", default_factory=dict)

    @field_validator("section_order")
    @classmethod
    def unique_design_sections(
        cls,
        values: list[ResumeDesignSection],
    ) -> list[ResumeDesignSection]:
        return list(dict.fromkeys(values))


class AIResumeDocument(ResumeSchema):
    data: ResumeData
    design: AIResumeDesign

    def to_storage(self) -> tuple[dict, str]:
        resume_data = self.data.to_storage()
        design = self.design
        resume_data.update(
            primaryColor=design.primary_color,
            secondaryColor=design.secondary_color,
            fontFamily=design.font_family,
            fontScale=design.font_scale,
            lineSpacing=design.line_spacing,
            pageMargin=design.page_margin,
            sectionOrder=design.section_order,
            elementStyles={
                key: value.model_dump(mode="json", by_alias=True, exclude_none=True)
                for key, value in design.element_styles.items()
            },
            pageSize="A4",
        )
        return ResumeData.model_validate(resume_data).to_storage(), str(design.template_id)


class ResumeUpdateRequest(ResumeSchema):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    template_id: EditorTemplateId | None = None
    resume_data: ResumeData | None = None
    source_version: int | None = Field(default=None, ge=1)


class ResumeAIEditRequest(ResumeSchema):
    instruction: str = Field(min_length=1, max_length=10_000)
    job_description: str | None = Field(default=None, max_length=20_000)
    reference_links: list[str] = Field(default_factory=list, max_length=20)

    @field_validator("reference_links")
    @classmethod
    def validate_reference_links(cls, values: list[str]) -> list[str]:
        return AIResumeRequest.validate_reference_links(values)


class ResumeAIEditProposal(BaseModel):
    resume_data: dict
    template_id: TemplateId


class ResumePDFResponse(BaseModel):
    download_url: str


class ResumeResponse(BaseModel):
    id: str
    title: str
    resume_type: ResumeKind
    editable: bool
    template_id: str | None = None
    resume_data: dict | None = None
    file_name: str | None = None
    file_size: int | None = None
    mime_type: str | None = None
    created_at: datetime
    updated_at: datetime
    download_url: str | None = None
    source_version: int


class ResumeListResponse(BaseModel):
    resumes: list[ResumeResponse]


class ResumeMessageResponse(BaseModel):
    message: str
