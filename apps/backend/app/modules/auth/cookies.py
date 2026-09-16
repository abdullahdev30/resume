from typing import Any

from fastapi import Response

from app.core.config import settings


def _cookie_options(max_age: int) -> dict[str, Any]:
    options: dict[str, Any] = {
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": settings.cookie_samesite,
        "path": "/",
        "max_age": max_age,
    }
    if settings.cookie_domain:
        options["domain"] = settings.cookie_domain
    return options


def set_auth_cookies(
    response: Response,
    *,
    access_token: str,
    refresh_token: str,
) -> None:
    response.set_cookie(
        settings.access_token_cookie_name,
        access_token,
        **_cookie_options(settings.access_token_max_age_seconds),
    )
    response.set_cookie(
        settings.refresh_token_cookie_name,
        refresh_token,
        **_cookie_options(settings.refresh_token_max_age_seconds),
    )


def clear_auth_cookies(response: Response) -> None:
    delete_options: dict[str, Any] = {
        "path": "/",
        "secure": settings.cookie_secure,
        "samesite": settings.cookie_samesite,
    }
    if settings.cookie_domain:
        delete_options["domain"] = settings.cookie_domain

    response.delete_cookie(
        settings.access_token_cookie_name,
        **delete_options,
    )
    response.delete_cookie(
        settings.refresh_token_cookie_name,
        **delete_options,
    )
