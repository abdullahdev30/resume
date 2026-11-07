from fastapi import Depends, HTTPException, Request

from app.modules.auth.dependencies import CURRENT_USER_DEPENDENCY
from app.modules.billing.service import access_for, subscription_for


def account_access(request: Request, user):
    """Authorization snapshot for one request, never cached across users/requests."""
    access = getattr(request.state, "account_access", None)
    if access is None:
        access = access_for(user.id)
        request.state.account_access = access
    return access


def require_account(request: Request, user=CURRENT_USER_DEPENDENCY):
    access = account_access(request, user)
    if not access["active"]:
        raise HTTPException(
            403, "Your account is deactivated. Contact an administrator."
        )
    return user


ACCOUNT = Depends(require_account)


def require_admin(request: Request, user=ACCOUNT):
    if account_access(request, user)["role"] not in ("admin", "super_admin"):
        raise HTTPException(403, "Administrator access required.")
    return user


ADMIN = Depends(require_admin)


def require_super_admin(request: Request, user=ADMIN):
    if account_access(request, user)["role"] != "super_admin":
        raise HTTPException(403, "Super administrator access required.")
    return user


def require_subscription(request: Request, user=ACCOUNT):
    if (
        request.method not in ("GET", "HEAD", "OPTIONS", "DELETE")
        and account_access(request, user)["role"] == "user"
        and subscription_for(user.id)["status"] != "active"
    ):
        raise HTTPException(
            403, "Your package is missing or expired. Select a package to continue."
        )
    return user
