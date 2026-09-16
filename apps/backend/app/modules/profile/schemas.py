from datetime import date, datetime
from typing import Any

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    HttpUrl,
    field_validator,
    model_validator,
)


class ProfileBaseModel(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)


class SocialLinkCreate(ProfileBaseModel):
    platform_name: str = Field(min_length=1, max_length=80)
    profile_url: HttpUrl


class SocialLinkUpdate(ProfileBaseModel):
    platform_name: str | None = Field(default=None, min_length=1, max_length=80)
    profile_url: HttpUrl | None = None


class SocialLinkResponse(ProfileBaseModel):
    id: str
    platform_name: str
    profile_url: str
    created_at: datetime
    updated_at: datetime


class PersonalInfoUpsert(ProfileBaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=5, max_length=30)
    address: str = Field(min_length=1, max_length=300)
    social_links: list[SocialLinkCreate] | None = None

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: Any) -> Any:
        if isinstance(value, str):
            return value.strip().lower()
        return value


class PersonalInfoResponse(ProfileBaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    address: str
    social_links: list[SocialLinkResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class DateRangeModel(ProfileBaseModel):
    start_date: date
    end_date: date | None = None

    @model_validator(mode="after")
    def validate_date_range(self) -> "DateRangeModel":
        if self.end_date is not None and self.end_date < self.start_date:
            raise ValueError("End date must be on or after start date.")
        return self


class EducationCreate(DateRangeModel):
    institute_name: str = Field(min_length=1, max_length=200)
    field_of_study: str = Field(min_length=1, max_length=160)
    grade: str | None = Field(default=None, max_length=80)


class EducationUpdate(ProfileBaseModel):
    institute_name: str | None = Field(default=None, min_length=1, max_length=200)
    field_of_study: str | None = Field(default=None, min_length=1, max_length=160)
    start_date: date | None = None
    end_date: date | None = None
    grade: str | None = Field(default=None, max_length=80)


class EducationResponse(ProfileBaseModel):
    id: str
    institute_name: str
    field_of_study: str
    start_date: date
    end_date: date | None = None
    grade: str | None = None
    created_at: datetime
    updated_at: datetime


class ExperienceCreate(DateRangeModel):
    institute_name: str = Field(min_length=1, max_length=200)
    job_title: str = Field(min_length=1, max_length=160)


class ExperienceUpdate(ProfileBaseModel):
    institute_name: str | None = Field(default=None, min_length=1, max_length=200)
    job_title: str | None = Field(default=None, min_length=1, max_length=160)
    start_date: date | None = None
    end_date: date | None = None


class ExperienceResponse(ProfileBaseModel):
    id: str
    institute_name: str
    job_title: str
    start_date: date
    end_date: date | None = None
    created_at: datetime
    updated_at: datetime


class SkillCreate(ProfileBaseModel):
    name: str = Field(min_length=1, max_length=100)


class SkillUpdate(ProfileBaseModel):
    name: str = Field(min_length=1, max_length=100)


class SkillResponse(ProfileBaseModel):
    id: str
    name: str
    created_at: datetime
    updated_at: datetime


class CertificateCreate(ProfileBaseModel):
    title: str = Field(min_length=1, max_length=180)
    category: str = Field(min_length=1, max_length=120)
    field: str = Field(min_length=1, max_length=120)
    file_url: HttpUrl | None = None


class CertificateUpdate(ProfileBaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=180)
    category: str | None = Field(default=None, min_length=1, max_length=120)
    field: str | None = Field(default=None, min_length=1, max_length=120)
    file_url: HttpUrl | None = None


class CertificateResponse(ProfileBaseModel):
    id: str
    title: str
    category: str
    field: str
    file_url: str | None = None
    file_name: str | None = None
    created_at: datetime
    updated_at: datetime


class ProjectCreate(ProfileBaseModel):
    name: str = Field(min_length=1, max_length=180)
    description: str = Field(min_length=1, max_length=2000)
    type: str = Field(min_length=1, max_length=120)
    link: HttpUrl | None = None


class ProjectUpdate(ProfileBaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=180)
    description: str | None = Field(default=None, min_length=1, max_length=2000)
    type: str | None = Field(default=None, min_length=1, max_length=120)
    link: HttpUrl | None = None


class ProjectResponse(ProfileBaseModel):
    id: str
    name: str
    description: str
    type: str
    link: str | None = None
    created_at: datetime
    updated_at: datetime


class OnboardingStatusResponse(ProfileBaseModel):
    personal_completed: bool
    education_count: int
    experience_count: int
    skill_count: int
    certificate_count: int
    project_count: int


class ProfileResponse(ProfileBaseModel):
    personal: PersonalInfoResponse
    education: list[EducationResponse] = Field(default_factory=list)
    experience: list[ExperienceResponse] = Field(default_factory=list)
    skills: list[SkillResponse] = Field(default_factory=list)
    certificates: list[CertificateResponse] = Field(default_factory=list)
    projects: list[ProjectResponse] = Field(default_factory=list)


class MessageResponse(ProfileBaseModel):
    message: str
