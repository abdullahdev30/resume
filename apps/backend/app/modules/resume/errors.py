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
        message=(
            "Resume file must be "
            f"{max_bytes // (1024 * 1024)} MB or smaller."
        ),
    )


def resume_update_error() -> ResumeApplicationError:
    return ResumeApplicationError(
        status_code=422,
        code="resume_update_error",
        message="Provide a new PDF file or a new title to update the resume.",
    )


def resume_storage_error() -> ResumeApplicationError:
    return ResumeApplicationError(
        status_code=502,
        code="resume_storage_error",
        message="Unable to store the resume file. Please try again.",
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
