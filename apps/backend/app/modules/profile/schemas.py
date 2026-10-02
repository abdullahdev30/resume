from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl, field_validator

from app.common.validation import normalize_phone_number


class ProfileBaseModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        str_strip_whitespace=True,
    )


class SocialLinkCreate(ProfileBaseModel):
    platform_name: str = Field(alias="platform", min_length=2, max_length=50)
    profile_url: HttpUrl = Field(alias="url")


class SocialLinkUpdate(ProfileBaseModel):
    platform_name: str | None = Field(
        default=None, alias="platform", min_length=2, max_length=50
    )
    profile_url: HttpUrl | None = Field(default=None, alias="url")


class SocialLinkResponse(ProfileBaseModel):
    id: str
    user_id: str | None = None
    platform_name: str
    profile_url: str
    created_at: datetime | str | None = None
    updated_at: datetime | str | None = None


class PersonalInfoUpsert(ProfileBaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    father_name: str | None = Field(default=None, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=20)
    address: str | None = Field(default=None, max_length=1000)
    city: str | None = Field(default=None, max_length=100)
    professional_title: str | None = Field(default=None, max_length=255)
    summary: str | None = Field(default=None, max_length=4000)
    social_links: list[SocialLinkCreate] | None = None

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: Any) -> Any:
        if isinstance(value, str):
            return value.strip().lower()
        return value

    @field_validator("phone", mode="before")
    @classmethod
    def normalize_phone(cls, value: Any) -> Any:
        if isinstance(value, str):
            return normalize_phone_number(value)
        return value

    def resolved_first_name(self) -> str:
        if self.name:
            return self.name
        if self.first_name:
            return self.first_name
        raise ValueError("Name is required.")


class PersonalInfoResponse(ProfileBaseModel):
    user_id: str
    name: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    father_name: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    city: str | None = None
    avatar_url: str | None = None
    professional_title: str | None = None
    summary: str | None = None
    onboarding_completed: bool | None = None
    social_links: list[SocialLinkResponse] = Field(default_factory=list)
    created_at: datetime | str | None = None
    updated_at: datetime | str | None = None


class DateRangeModel(ProfileBaseModel):
    start_date: date
    end_date: date | None = None
    is_current: bool = False

    @field_validator("end_date")
    @classmethod
    def validate_date_range(cls, value: date | None, info):
        start_date = info.data.get("start_date")
        if value is not None and start_date is not None and value < start_date:
            raise ValueError("End date must be on or after start date.")
        return value


class EducationCreate(DateRangeModel):
    institute_name: str = Field(alias="institution", min_length=2, max_length=255)
    degree: str | None = Field(default=None, max_length=255)
    field_of_study: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    grade: str | None = Field(default=None, max_length=100)


class EducationUpdate(ProfileBaseModel):
    institute_name: str | None = Field(
        default=None, alias="institution", min_length=2, max_length=255
    )
    degree: str | None = Field(default=None, max_length=255)
    field_of_study: str | None = Field(default=None, max_length=255)
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool | None = None
    description: str | None = Field(default=None, max_length=2000)
    grade: str | None = Field(default=None, max_length=100)


class EducationResponse(ProfileBaseModel):
    id: str
    institute_name: str
    degree: str | None = None
    field_of_study: str | None = None
    start_date: date | str | None = None
    end_date: date | str | None = None
    is_current: bool | None = False
    description: str | None = None
    grade: str | None = None
    created_at: datetime | str | None = None
    updated_at: datetime | str | None = None


class ExperienceCreate(DateRangeModel):
    company_name: str | None = Field(default=None, min_length=2, max_length=255)
    institute_name: str | None = Field(default=None, min_length=2, max_length=255)
    job_title: str = Field(alias="position", min_length=2, max_length=255)
    location: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=4000)

    def resolved_company_name(self) -> str:
        value = self.company_name or self.institute_name
        if not value:
            raise ValueError("Company name is required.")
        return value


class ExperienceUpdate(ProfileBaseModel):
    company_name: str | None = Field(default=None, min_length=2, max_length=255)
    institute_name: str | None = Field(default=None, min_length=2, max_length=255)
    job_title: str | None = Field(
        default=None, alias="position", min_length=2, max_length=255
    )
    location: str | None = Field(default=None, max_length=255)
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool | None = None
    description: str | None = Field(default=None, max_length=4000)


class ExperienceResponse(ProfileBaseModel):
    id: str
    company_name: str | None = None
    institute_name: str | None = None
    job_title: str
    location: str | None = None
    start_date: date | str | None = None
    end_date: date | str | None = None
    is_current: bool | None = False
    description: str | None = None
    created_at: datetime | str | None = None
    updated_at: datetime | str | None = None


class SkillCreate(ProfileBaseModel):
    name: str = Field(min_length=1, max_length=150)
    category: str | None = Field(default=None, max_length=100)
    level: str | None = Field(default=None, max_length=50)


class SkillUpdate(ProfileBaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    category: str | None = Field(default=None, max_length=100)
    level: str | None = Field(default=None, max_length=50)


class SkillResponse(ProfileBaseModel):
    id: str
    name: str
    category: str | None = None
    level: str | None = None
    created_at: datetime | str | None = None
    updated_at: datetime | str | None = None


class CertificateCreate(ProfileBaseModel):
    title: str = Field(alias="name", min_length=2, max_length=255)
    category: str | None = Field(
        default=None, alias="issuing_organization", max_length=255
    )
    field: str | None = Field(default=None, alias="credential_id", max_length=255)
    file_url: str | None = Field(default=None, alias="credential_url")
    file_name: str | None = None
    issue_date: date | None = None
    expiration_date: date | None = None


class CertificateUpdate(ProfileBaseModel):
    title: str | None = Field(default=None, alias="name", min_length=2, max_length=255)
    category: str | None = Field(
        default=None, alias="issuing_organization", max_length=255
    )
    field: str | None = Field(default=None, alias="credential_id", max_length=255)
    file_url: str | None = Field(default=None, alias="credential_url")
    file_name: str | None = None
    issue_date: date | None = None
    expiration_date: date | None = None


class CertificateResponse(ProfileBaseModel):
    id: str
    title: str
    category: str | None = None
    field: str | None = None
    file_url: str | None = None
    file_name: str | None = None
    issue_date: date | str | None = None
    expiration_date: date | str | None = None
    created_at: datetime | str | None = None
    updated_at: datetime | str | None = None


class ProjectCreate(ProfileBaseModel):
    name: str = Field(min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=4000)
    link: str | None = Field(default=None, alias="url")
    github_url: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    technologies: list[str] | None = None
    type: str | None = None


class ProjectUpdate(ProfileBaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=4000)
    link: str | None = Field(default=None, alias="url")
    github_url: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    technologies: list[str] | None = None
    type: str | None = None


class ProjectResponse(ProfileBaseModel):
    id: str
    name: str
    description: str | None = None
    type: str | None = None
    link: str | None = None
    github_url: str | None = None
    start_date: date | str | None = None
    end_date: date | str | None = None
    technologies: list[str] | None = None
    created_at: datetime | str | None = None
    updated_at: datetime | str | None = None


class ProfileResponse(ProfileBaseModel):
    personal: PersonalInfoResponse
    education: list[EducationResponse] = Field(default_factory=list)
    experience: list[ExperienceResponse] = Field(default_factory=list)
    skills: list[SkillResponse] = Field(default_factory=list)
    certificates: list[CertificateResponse] = Field(default_factory=list)
    projects: list[ProjectResponse] = Field(default_factory=list)
    social_links: list[SocialLinkResponse] = Field(default_factory=list)


class OnboardingStatusResponse(ProfileBaseModel):
    current_step: int
    is_completed: bool
    personal_completed: bool = False
    education_count: int = 0
    experience_count: int = 0
    skill_count: int = 0
    certificate_count: int = 0
    project_count: int = 0
    social_link_count: int = 0
    data: dict[str, Any] | None = None
