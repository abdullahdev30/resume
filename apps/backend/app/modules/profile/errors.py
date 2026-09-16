from dataclasses import dataclass

from fastapi import HTTPException


@dataclass(frozen=True)
class ProfileApplicationError(Exception):
    status_code: int
    code: str
    message: str

    @property
    def detail(self) -> dict[str, str]:
        return {
            "code": self.code,
            "message": self.message,
        }


def profile_not_found_error() -> ProfileApplicationError:
    return ProfileApplicationError(
        status_code=404,
        code="profile_not_found",
        message="Personal profile information is required first.",
    )


def item_not_found_error(item_name: str) -> ProfileApplicationError:
    return ProfileApplicationError(
        status_code=404,
        code=f"{item_name}_not_found",
        message="The requested profile item was not found.",
    )


def raise_profile_error(error: ProfileApplicationError) -> None:
    raise HTTPException(
        status_code=error.status_code,
        detail=error.detail,
    )
