from decimal import Decimal
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.modules.billing.dependencies import (
    account_access,
    require_account,
    require_admin,
    require_super_admin,
)
from app.modules.billing.service import (
    database,
    subscribe,
    subscription_for,
)

router = APIRouter(tags=["Packages and administration"])
ACCOUNT = Depends(require_account)
ADMIN = Depends(require_admin)
SUPER_ADMIN = Depends(require_super_admin)


class PackageInput(BaseModel):
    name: str = Field(min_length=1, max_length=100, pattern=r"\S")
    description: str = Field(default="", max_length=1000)
    persona_limit: int = Field(ge=1, le=10000, strict=True)
    monthly_price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    yearly_price: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    currency: str = Field(default="USD", pattern=r"^[A-Z]{3}$")


class SubscribeInput(BaseModel):
    package_id: UUID


class AccessInput(BaseModel):
    active: bool


class RoleInput(BaseModel):
    role: Literal["user", "admin"]


@router.get("/billing/me")
def me(request: Request, user=ACCOUNT):
    return {**account_access(request, user), **subscription_for(user.id)}


@router.get("/billing/packages")
def packages(user=ACCOUNT):
    with database() as cursor:
        cursor.execute(
            "SELECT * FROM subscription_packages WHERE available ORDER BY monthly_price, persona_limit, name"
        )
        return cursor.fetchall()


@router.get("/public/packages")
def public_packages():
    """Public catalog only; no account or subscription information."""
    with database() as cursor:
        cursor.execute(
            """SELECT id, name, description, persona_limit, monthly_price, yearly_price, currency
            FROM subscription_packages WHERE available
            ORDER BY monthly_price, persona_limit, name"""
        )
        return cursor.fetchall()


@router.post("/billing/subscribe")
def select_package(payload: SubscribeInput, user=ACCOUNT):
    with database() as cursor:
        cursor.execute(
            "SELECT monthly_price FROM subscription_packages WHERE id=%s AND available",
            (payload.package_id,),
        )
        package = cursor.fetchone()
    if not package:
        raise HTTPException(404, "This package is no longer available.")
    if package["monthly_price"] > 0:
        raise HTTPException(402, "Paid packages must be activated through verified Safepay payment.")
    return subscribe(user.id, payload.package_id)


@router.get("/admin/users")
def users(limit: int = 50, offset: int = 0, user=ADMIN):
    if not 1 <= limit <= 100 or offset < 0:
        raise HTTPException(422, "Invalid page.")
    with database() as cursor:
        cursor.execute(
            """SELECT u.id, u.email, u.raw_user_meta_data->>'name' AS name,
            COALESCE(a.role, 'user') AS role, COALESCE(a.active, TRUE) AS active,
            s.package_name, s.expires_at,
            CASE WHEN s.user_id IS NULL THEN 'unsubscribed' WHEN s.expires_at <= NOW() THEN 'expired' ELSE 'active' END AS subscription_status,
            COALESCE((SELECT jsonb_agg(jsonb_build_object('id',p.id,'name',p.name) ORDER BY p.created_at)
                FROM personas p WHERE p.user_id=u.id),'[]'::jsonb) AS personas
            FROM auth.users u LEFT JOIN account_access a ON a.user_id=u.id
            LEFT JOIN user_subscriptions s ON s.user_id=u.id ORDER BY u.created_at DESC, u.id LIMIT %s OFFSET %s""",
            (limit, offset),
        )
        return cursor.fetchall()


@router.patch("/admin/users/{user_id}/status")
def status(user_id: UUID, payload: AccessInput, request: Request, user=ADMIN):
    with database() as cursor:
        # Lock the target identity so role/status writes cannot race each other.
        cursor.execute("SELECT id FROM auth.users WHERE id=%s FOR UPDATE", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(404, "User not found.")
        cursor.execute("SELECT role FROM account_access WHERE user_id=%s", (user_id,))
        target = cursor.fetchone()
        if str(user_id) == str(user.id) or (target and target["role"] == "super_admin"):
            raise HTTPException(403, "You cannot change this account status.")
        if (
            target
            and target["role"] == "admin"
            and account_access(request, user)["role"] != "super_admin"
        ):
            raise HTTPException(
                403, "Only a super administrator can manage administrators."
            )
        cursor.execute(
            """INSERT INTO account_access(user_id, active) VALUES (%s,%s)
            ON CONFLICT(user_id) DO UPDATE SET active=EXCLUDED.active""",
            (user_id, payload.active),
        )
    return {"message": "Account status updated."}


@router.patch("/admin/users/{user_id}/role")
def role(user_id: UUID, payload: RoleInput, user=SUPER_ADMIN):
    with database() as cursor:
        cursor.execute("SELECT id FROM auth.users WHERE id=%s FOR UPDATE", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(404, "User not found.")
        cursor.execute("SELECT role FROM account_access WHERE user_id=%s", (user_id,))
        target = cursor.fetchone()
        if str(user_id) == str(user.id) or (target and target["role"] == "super_admin"):
            raise HTTPException(
                403, "Super administrator roles are managed by the operator."
            )
        cursor.execute(
            """INSERT INTO account_access(user_id, role) VALUES (%s,%s)
            ON CONFLICT(user_id) DO UPDATE SET role=EXCLUDED.role""",
            (user_id, payload.role),
        )
    return {"message": "Role updated."}


@router.post("/admin/packages")
def create_package(payload: PackageInput, user=SUPER_ADMIN):
    with database() as cursor:
        cursor.execute(
            """INSERT INTO subscription_packages(name, description, persona_limit, monthly_price, yearly_price, currency)
            VALUES (%s,%s,%s,%s,%s,%s) RETURNING *""",
            (payload.name, payload.description, payload.persona_limit, payload.monthly_price, payload.yearly_price, payload.currency),
        )
        return cursor.fetchone()


@router.put("/admin/packages/{package_id}")
def edit_package(package_id: UUID, payload: PackageInput, user=SUPER_ADMIN):
    with database() as cursor:
        cursor.execute(
            """UPDATE subscription_packages SET name=%s, description=%s, persona_limit=%s,
            monthly_price=%s, yearly_price=%s, currency=%s WHERE id=%s AND available RETURNING *""",
            (payload.name, payload.description, payload.persona_limit, payload.monthly_price, payload.yearly_price, payload.currency, package_id),
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(404, "Package not found.")
        return row


@router.delete("/admin/packages/{package_id}")
def delete_package(package_id: UUID, user=SUPER_ADMIN):
    with database() as cursor:
        cursor.execute(
            "UPDATE subscription_packages SET available=FALSE WHERE id=%s AND available RETURNING id",
            (package_id,),
        )
        if not cursor.fetchone():
            raise HTTPException(404, "Package not found.")
    return {
        "message": "Package removed. Existing subscriptions remain valid until expiration."
    }
