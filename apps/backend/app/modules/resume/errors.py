from dataclasses import dataclass

from fastapi import HTTPException


@dataclass(frozen=True)
class ResumeApplicationError(Exception):
    status_code: int
    code: str
    message: str

    @property
    def detail(self) -> dict[str, str]:
        return {
            "code": self.code,
            "message": self.message,
        }


def resume_not_found_error() -> ResumeApplicationError:
    return ResumeApplicationError(
        status_code=404,
        code="resume_not_found",
        message="Resume not found.",
    )


def invalid_resume_file_error(message: str) -> ResumeApplicationError:
    return ResumeApplicationError(
        status_code=422,
        code="invalid_resume_file",
        message=message,
    )


def resume_file_too_large_error(max_bytes: int) -> ResumeApplicationError:
    return ResumeApplicationError(
        status_code=413,
        code="resume_file_too_large",
        message=(f"Resume file must be {max_bytes // (1024 * 1024)} MB or smaller."),
    )


def resume_update_error() -> ResumeApplicationError:
    return ResumeApplicationError(
        status_code=422,
        code="resume_update_error",
        message="Provide a new PDF file or a new title to update the resume.",
    )


def resume_not_editable_error() -> ResumeApplicationError:
    return ResumeApplicationError(
        status_code=409,
        code="resume_not_editable",
        message="This legacy PDF resume cannot be edited. Create a template or AI resume to edit source content.",
    )


def resume_ai_error() -> ResumeApplicationError:
    return ResumeApplicationError(
        status_code=502,
        code="AI_PROVIDER_ERROR",
        message="Unable to generate resume content. Please try again.",
    )


def resume_ai_not_configured_error() -> ResumeApplicationError:
    return ResumeApplicationError(
        status_code=503,
        code="AI_NOT_CONFIGURED",
        message="AI resume generation is not configured. Ask an administrator to set AI_API_KEY.",
    )


def resume_ai_invalid_output_error() -> ResumeApplicationError:
    return ResumeApplicationError(
        status_code=502,
        code="AI_INVALID_OUTPUT",
        message="The AI returned an invalid resume. Please revise the prompt and try again.",
    )


def resume_ai_timeout_error() -> ResumeApplicationError:
    return ResumeApplicationError(
        status_code=504,
        code="AI_TIMEOUT",
        message="AI resume generation timed out. Please try again.",
    )


def resume_ai_rate_limit_error() -> ResumeApplicationError:
    return ResumeApplicationError(
        status_code=429,
        code="RATE_LIMITED",
        message="The AI provider is busy. Please wait and try again.",
    )


def resume_profile_required_error() -> ResumeApplicationError:
    return ResumeApplicationError(
        status_code=422,
        code="resume_profile_required",
        message="Complete your profile before generating an AI resume.",
    )


def resume_storage_error() -> ResumeApplicationError:
    return ResumeApplicationError(
        status_code=502,
        code="resume_storage_error",
        message="Unable to store the resume file. Please try again.",
    )


def resume_version_conflict_error() -> ResumeApplicationError:
    return ResumeApplicationError(
        status_code=409,
        code="resume_version_conflict",
        message="This resume was changed in another tab. Reload before saving again.",
    )


def resume_pdf_unavailable_error() -> ResumeApplicationError:
    return ResumeApplicationError(
        status_code=409,
        code="resume_pdf_unavailable",
        message="Editable resumes are downloaded directly from the browser.",
    )


def resume_persistence_error() -> ResumeApplicationError:
    return ResumeApplicationError(
        status_code=500,
        code="resume_persistence_error",
        message="Unable to save the resume. Please try again.",
    )


def raise_resume_error(error: ResumeApplicationError) -> None:
    raise HTTPException(
        status_code=error.status_code,
        detail=error.detail,
    )
