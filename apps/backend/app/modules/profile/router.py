from fastapi import APIRouter, File, Form, UploadFile, status

from app.modules.auth.dependencies import CURRENT_USER_DEPENDENCY
from app.modules.auth.schemas import UserResponse
from app.modules.profile.errors import ProfileApplicationError, raise_profile_error
from app.modules.profile.schemas import (
    CertificateCreate,
    CertificateResponse,
    CertificateUpdate,
    EducationCreate,
    EducationResponse,
    EducationUpdate,
    ExperienceCreate,
    ExperienceResponse,
    ExperienceUpdate,
    MessageResponse,
    OnboardingStatusResponse,
    PersonalInfoResponse,
    PersonalInfoUpsert,
    ProfileResponse,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
    SkillCreate,
    SkillResponse,
    SkillUpdate,
    SocialLinkCreate,
    SocialLinkResponse,
    SocialLinkUpdate,
)
from app.modules.profile.service import ProfileService

router = APIRouter(
    prefix="/profile",
    tags=["Profile"],
)

profile_service = ProfileService()
CERTIFICATE_FILE_DEPENDENCY = File()


def _user_id(current_user: UserResponse) -> str:
    return current_user.id


@router.get(
    "",
    response_model=ProfileResponse,
)
def get_profile(
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
) -> ProfileResponse:
    try:
        return profile_service.get_profile(_user_id(current_user))
    except ProfileApplicationError as exc:
        raise_profile_error(exc)


@router.get(
    "/onboarding/status",
    response_model=OnboardingStatusResponse,
)
def get_onboarding_status(
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
) -> OnboardingStatusResponse:
    return profile_service.onboarding_status(_user_id(current_user))


@router.put(
    "/personal",
    response_model=PersonalInfoResponse,
)
@router.post(
    "/onboarding/personal",
    response_model=PersonalInfoResponse,
)
def upsert_personal(
    payload: PersonalInfoUpsert,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
) -> PersonalInfoResponse:
    return profile_service.upsert_personal(_user_id(current_user), payload)


@router.post(
    "/social-links",
    response_model=SocialLinkResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_social_link(
    payload: SocialLinkCreate,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
) -> SocialLinkResponse:
    try:
        return profile_service.add_social_link(_user_id(current_user), payload)
    except ProfileApplicationError as exc:
        raise_profile_error(exc)


@router.put(
    "/social-links/{item_id}",
    response_model=SocialLinkResponse,
)
def update_social_link(
    item_id: str,
    payload: SocialLinkUpdate,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
) -> SocialLinkResponse:
    try:
        return profile_service.update_social_link(
            _user_id(current_user),
            item_id,
            payload,
        )
    except ProfileApplicationError as exc:
        raise_profile_error(exc)


@router.delete(
    "/social-links/{item_id}",
    response_model=MessageResponse,
)
def delete_social_link(
    item_id: str,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
) -> MessageResponse:
    try:
        profile_service.delete_social_link(_user_id(current_user), item_id)
        return MessageResponse(message="Social link deleted successfully.")
    except ProfileApplicationError as exc:
        raise_profile_error(exc)


@router.post(
    "/education",
    response_model=EducationResponse,
    status_code=status.HTTP_201_CREATED,
)
@router.post(
    "/onboarding/education",
    response_model=EducationResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_education(
    payload: EducationCreate,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
) -> EducationResponse:
    try:
        return profile_service.add_education(_user_id(current_user), payload)
    except ProfileApplicationError as exc:
        raise_profile_error(exc)


@router.put(
    "/education/{item_id}",
    response_model=EducationResponse,
)
def update_education(
    item_id: str,
    payload: EducationUpdate,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
) -> EducationResponse:
    try:
        return profile_service.update_education(
            _user_id(current_user),
            item_id,
            payload,
        )
    except ProfileApplicationError as exc:
        raise_profile_error(exc)


@router.delete(
    "/education/{item_id}",
    response_model=MessageResponse,
)
def delete_education(
    item_id: str,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
) -> MessageResponse:
    try:
        profile_service.delete_education(_user_id(current_user), item_id)
        return MessageResponse(message="Education deleted successfully.")
    except ProfileApplicationError as exc:
        raise_profile_error(exc)


@router.post(
    "/experience",
    response_model=ExperienceResponse,
    status_code=status.HTTP_201_CREATED,
)
@router.post(
    "/onboarding/experience",
    response_model=ExperienceResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_experience(
    payload: ExperienceCreate,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
) -> ExperienceResponse:
    try:
        return profile_service.add_experience(_user_id(current_user), payload)
    except ProfileApplicationError as exc:
        raise_profile_error(exc)


@router.put(
    "/experience/{item_id}",
    response_model=ExperienceResponse,
)
def update_experience(
    item_id: str,
    payload: ExperienceUpdate,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
) -> ExperienceResponse:
    try:
        return profile_service.update_experience(
            _user_id(current_user),
            item_id,
            payload,
        )
    except ProfileApplicationError as exc:
        raise_profile_error(exc)


@router.delete(
    "/experience/{item_id}",
    response_model=MessageResponse,
)
def delete_experience(
    item_id: str,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
) -> MessageResponse:
    try:
        profile_service.delete_experience(_user_id(current_user), item_id)
        return MessageResponse(message="Experience deleted successfully.")
    except ProfileApplicationError as exc:
        raise_profile_error(exc)


@router.post(
    "/skills",
    response_model=SkillResponse,
    status_code=status.HTTP_201_CREATED,
)
@router.post(
    "/onboarding/skills",
    response_model=SkillResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_skill(
    payload: SkillCreate,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
) -> SkillResponse:
    try:
        return profile_service.add_skill(_user_id(current_user), payload)
    except ProfileApplicationError as exc:
        raise_profile_error(exc)


@router.put(
    "/skills/{item_id}",
    response_model=SkillResponse,
)
def update_skill(
    item_id: str,
    payload: SkillUpdate,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
) -> SkillResponse:
    try:
        return profile_service.update_skill(_user_id(current_user), item_id, payload)
    except ProfileApplicationError as exc:
        raise_profile_error(exc)


@router.delete(
    "/skills/{item_id}",
    response_model=MessageResponse,
)
def delete_skill(
    item_id: str,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
) -> MessageResponse:
    try:
        profile_service.delete_skill(_user_id(current_user), item_id)
        return MessageResponse(message="Skill deleted successfully.")
    except ProfileApplicationError as exc:
        raise_profile_error(exc)


@router.post(
    "/certificates",
    response_model=CertificateResponse,
    status_code=status.HTTP_201_CREATED,
)
@router.post(
    "/onboarding/certificates",
    response_model=CertificateResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_certificate(
    payload: CertificateCreate,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
) -> CertificateResponse:
    try:
        return profile_service.add_certificate(_user_id(current_user), payload)
    except ProfileApplicationError as exc:
        raise_profile_error(exc)


@router.post(
    "/certificates/upload",
    response_model=CertificateResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_certificate(
    title: str = Form(min_length=1, max_length=180),
    category: str = Form(min_length=1, max_length=120),
    field: str = Form(min_length=1, max_length=120),
    file: UploadFile = CERTIFICATE_FILE_DEPENDENCY,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
) -> CertificateResponse:
    try:
        return profile_service.add_certificate_upload(
            _user_id(current_user),
            title=title,
            category=category,
            field=field,
            file=file,
        )
    except ProfileApplicationError as exc:
        raise_profile_error(exc)


@router.put(
    "/certificates/{item_id}",
    response_model=CertificateResponse,
)
def update_certificate(
    item_id: str,
    payload: CertificateUpdate,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
) -> CertificateResponse:
    try:
        return profile_service.update_certificate(
            _user_id(current_user),
            item_id,
            payload,
        )
    except ProfileApplicationError as exc:
        raise_profile_error(exc)


@router.delete(
    "/certificates/{item_id}",
    response_model=MessageResponse,
)
def delete_certificate(
    item_id: str,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
) -> MessageResponse:
    try:
        profile_service.delete_certificate(_user_id(current_user), item_id)
        return MessageResponse(message="Certificate deleted successfully.")
    except ProfileApplicationError as exc:
        raise_profile_error(exc)


@router.post(
    "/projects",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_project(
    payload: ProjectCreate,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
) -> ProjectResponse:
    try:
        return profile_service.add_project(_user_id(current_user), payload)
    except ProfileApplicationError as exc:
        raise_profile_error(exc)


@router.put(
    "/projects/{item_id}",
    response_model=ProjectResponse,
)
def update_project(
    item_id: str,
    payload: ProjectUpdate,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
) -> ProjectResponse:
    try:
        return profile_service.update_project(_user_id(current_user), item_id, payload)
    except ProfileApplicationError as exc:
        raise_profile_error(exc)


@router.delete(
    "/projects/{item_id}",
    response_model=MessageResponse,
)
def delete_project(
    item_id: str,
    current_user: UserResponse = CURRENT_USER_DEPENDENCY,
) -> MessageResponse:
    try:
        profile_service.delete_project(_user_id(current_user), item_id)
        return MessageResponse(message="Project deleted successfully.")
    except ProfileApplicationError as exc:
        raise_profile_error(exc)
