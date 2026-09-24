# backend/app/modules/profile/router.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.modules.profile.models import PersonalDetail
from app.modules.profile.schemas import PersonalDetailUpdate, OnboardingStatusResponse
from app.integrations.s3_storage import S3StorageService

router = APIRouter(prefix="/profile", tags=["Onboarding & Profile"])
s3_service = S3StorageService()

@router.get("/onboarding-status", response_model=OnboardingStatusResponse)
def get_onboarding_status(user_id: int, db: Session = Depends(get_db)):
    detail = db.query(PersonalDetail).filter(PersonalDetail.user_id == user_id).first()
    if not detail:
        return {"current_step": 1, "is_completed": False, "data": {}}
    
    return {
        "current_step": detail.onboarding_step,
        "is_completed": detail.is_onboarding_completed,
        "data": {
            "avatar_url": detail.avatar_url,
            "education": detail.education,
            "experience": detail.experience,
            "certificates": detail.certificates,
            "skills": detail.skills,
            "social_links": detail.social_links,
        }
    }

@router.patch("/onboarding-update")
def update_onboarding_stage(user_id: int, payload: PersonalDetailUpdate, db: Session = Depends(get_db)):
    detail = db.query(PersonalDetail).filter(PersonalDetail.user_id == user_id).first()
    if not detail:
        detail = PersonalDetail(user_id=user_id)
        db.add(detail)
    
    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(detail, key, value)
        
    db.commit()
    db.refresh(detail)
    return {"message": "Onboarding stage updated successfully", "current_step": detail.onboarding_step}

@router.post("/upload-file")
async def upload_onboarding_file(file: UploadFile = File(...), folder: str = "certificates"):
    file_url = await s3_service.upload_file(file, folder=folder)
    return {"file_url": file_url}