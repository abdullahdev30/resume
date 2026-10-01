# backend/app/modules/profile/models.py
from sqlalchemy import JSON, Boolean, Column, Integer, String

from app.database.connection import Base


class PersonalDetail(Base):
    __tablename__ = "personal_details"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, index=True)

    # Basic Profile & Avatar
    avatar_url = Column(String, nullable=True)

    # Merged Onboarding Stages / Sections (Stored flexibly or via structured JSON/Relations)
    education = Column(JSON, nullable=True)     # List of {institution, degree, start_date, end_date, is_current}
    experience = Column(JSON, nullable=True)    # List of {company, role, start_date, end_date, is_current}
    certificates = Column(JSON, nullable=True)  # List of {title, file_url, issue_date}
    skills = Column(JSON, nullable=True)
    social_links = Column(JSON, nullable=True)
    
    # Onboarding Status Tracking
    onboarding_step = Column(Integer, default=1)  # Sequence Tracker: 1=Basic Info, 2=Education, 3=Experience, etc.
    is_onboarding_completed = Column(Boolean, default=False)
