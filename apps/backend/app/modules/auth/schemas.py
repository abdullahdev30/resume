import re
import unicodedata
from typing import Any

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)

PHONE_NUMBER_PATTERN = re.compile(r"^\d{11}$")
OTP_PATTERN = re.compile(r"^\d{6}$")


def validate_password_strength(value: str) -> str:
    if value != value.strip():
        raise ValueError("Password must not start or end with whitespace.")
    if not any(character.isupper() for character in value):
        raise ValueError("Password must contain an uppercase letter.")
    if not any(character.islower() for character in value):
        raise ValueError("Password must contain a lowercase letter.")
    if not any(character.isdigit() for character in value):
        raise ValueError("Password must contain a digit.")
    if not any(not character.isalnum() for character in value):
        raise ValueError("Password must contain a special character.")
    return value


def _normalize_email(value: Any) -> Any:
    if isinstance(value, str):
        return value.strip().lower()
    return value


def _normalize_name(value: str) -> str:
    normalized = value.strip()
    if any(unicodedata.category(character).startswith("C") for character in normalized):
        raise ValueError("Name must not contain control characters.")
    return normalized


class AuthBaseModel(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=False)


class RegisterRequest(AuthBaseModel):
    name: str = Field(min_length=2, max_length=100, strict=True)
    email: EmailStr
    number: str = Field(min_length=11, max_length=11, strict=True)
    password: str = Field(min_length=8, max_length=128, strict=True)
    confirm_password: str = Field(min_length=8, max_length=128, strict=True)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return _normalize_name(value)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: Any) -> Any:
        return _normalize_email(value)

    @field_validator("number")
    @classmethod
    def validate_phone_number(cls, value: str) -> str:
        if not PHONE_NUMBER_PATTERN.fullmatch(value):
            raise ValueError("Number must contain exactly 11 digits.")
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return validate_password_strength(value)

    @model_validator(mode="after")
    def validate_password_confirmation(self) -> "RegisterRequest":
        if self.password != self.confirm_password:
            raise ValueError("Password confirmation does not match.")
        return self


class RegisterResponse(BaseModel):
    message: str
    email: str
    email_verification_required: bool


class EmailRequest(AuthBaseModel):
    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: Any) -> Any:
        return _normalize_email(value)


class VerifyEmailOtpRequest(EmailRequest):
    otp: str = Field(min_length=6, max_length=6, strict=True)

    @field_validator("otp")
    @classmethod
    def validate_otp(cls, value: str) -> str:
        otp = value.strip()
        if not OTP_PATTERN.fullmatch(otp):
            raise ValueError("OTP must be a 6-digit code.")
        return otp


class ResendVerificationRequest(EmailRequest):
    pass


class LoginRequest(EmailRequest):
    password: str = Field(min_length=1, max_length=128, strict=True)


class RefreshSessionRequest(AuthBaseModel):
    refresh_token: str = Field(min_length=1, max_length=4096, strict=True)


class ForgotPasswordRequest(EmailRequest):
    pass


class VerifyRecoveryOtpRequest(VerifyEmailOtpRequest):
    pass


class ChangePasswordRequest(AuthBaseModel):
    new_password: str = Field(min_length=8, max_length=128, strict=True)
    confirm_new_password: str = Field(min_length=8, max_length=128, strict=True)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        return validate_password_strength(value)

    @model_validator(mode="after")
    def validate_new_password_confirmation(self) -> "ChangePasswordRequest":
        if self.new_password != self.confirm_new_password:
            raise ValueError("New password confirmation does not match.")
        return self


class UserResponse(BaseModel):
    id: str
    email: str
    name: str | None = None
    number: str | None = None
    email_verified: bool | None = None


class VerifyEmailResponse(BaseModel):
    message: str
    user: UserResponse


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int | None = None


class MessageResponse(BaseModel):
    message: str
