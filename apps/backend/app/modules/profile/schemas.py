# backend/app/modules/profile/schemas.py
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class EducationItem(BaseModel):
    institution: str
    degree: str
    start_date: str
    end_date: Optional[str] = None
    is_current: bool = False

class ExperienceItem(BaseModel):
    company: str
    role: str
    start_date: str
    end_date: Optional[str] = None
    is_current: bool = False

class PersonalDetailUpdate(BaseModel):
    avatar_url: Optional[str] = None
    education: Optional[List[EducationItem]] = None
    experience: Optional[List[ExperienceItem]] = None
    certificates: Optional[List[Dict[str, Any]]] = None
    skills: Optional[List[str]] = None
    social_links: Optional[Dict[str, str]] = None
    onboarding_step: Optional[int] = None
    is_onboarding_completed: Optional[bool] = None

class OnboardingStatusResponse(BaseModel):
    current_step: int
    is_completed: bool
    data: Optional[Dict[str, Any]] = None