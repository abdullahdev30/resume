from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from app.modules.profile.schemas import PersonalInfoUpsert

Category = Literal[
    "education", "experience", "skills", "certificates", "projects", "social_links"
]


class PersonaMetadata(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(default="", max_length=500)


class PersonaCreate(PersonaMetadata):
    use_account_profile: bool = False


class PersonaDetailsPrompt(BaseModel):
    paragraph: str = Field(min_length=10, max_length=10000)


class PersonaPersonal(PersonalInfoUpsert):
    country: str | None = Field(default=None, max_length=100)
    region: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=32)
    date_of_birth: date | None = None
    nationality: str | None = Field(default=None, max_length=100)


class PersonaResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: str
    avatar_url: str | None = None
    completion: int
    data: dict[str, Any]
    created_at: datetime | str
    updated_at: datetime | str
