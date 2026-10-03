from datetime import UTC, datetime, timedelta
from typing import Any

from app.database.connection import get_connection


class GuestAccountRepository:
    """Server-only persistence for temporary guest account lifetimes."""

    def create(self, user_id: str, *, ttl_hours: int) -> datetime:
        expires_at = datetime.now(UTC) + timedelta(hours=ttl_hours)
        with get_connection() as connection, connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO public.guest_accounts (user_id, expires_at)
                VALUES (%s, %s)
                ON CONFLICT (user_id) DO UPDATE SET
                    last_active_at = NOW(),
                    expires_at = EXCLUDED.expires_at,
                    pending_email = NULL,
                    upgraded_at = NULL
                RETURNING expires_at
                """,
                (user_id, expires_at),
            )
            row = cursor.fetchone()
        return row[0]

    def get(self, user_id: str) -> dict[str, Any] | None:
        with get_connection() as connection, connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT user_id::text, guest_id::text, created_at,
                       last_active_at, expires_at, pending_email, upgraded_at
                FROM public.guest_accounts
                WHERE user_id = %s
                """,
                (user_id,),
            )
            row = cursor.fetchone()
            if row is None:
                return None
            columns = [column.name for column in cursor.description]
            return dict(zip(columns, row, strict=True))

    def require_active(self, user_id: str) -> datetime | None:
        with get_connection() as connection, connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE public.guest_accounts
                SET last_active_at = NOW()
                WHERE user_id = %s
                  AND upgraded_at IS NULL
                  AND expires_at > NOW()
                RETURNING expires_at
                """,
                (user_id,),
            )
            row = cursor.fetchone()
        return row[0] if row else None

    def set_pending_email(self, user_id: str, email: str) -> None:
        with get_connection() as connection, connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE public.guest_accounts
                SET pending_email = %s, last_active_at = NOW()
                WHERE user_id = %s
                  AND upgraded_at IS NULL
                  AND expires_at > NOW()
                """,
                (email, user_id),
            )
            if cursor.rowcount != 1:
                raise LookupError("Guest session is not active.")

    def pending_email_matches(self, user_id: str, email: str) -> bool:
        record = self.get(user_id)
        return bool(
            record
            and record["upgraded_at"] is None
            and record["expires_at"] > datetime.now(UTC)
            and record["pending_email"] == email
        )

    def complete_upgrade(
        self,
        user_id: str,
        *,
        name: str,
        email: str,
        phone: str,
    ) -> None:
        first_name, _, last_name = name.strip().partition(" ")
        with get_connection() as connection, connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO public.profiles (
                    id, first_name, last_name, email, phone,
                    onboarding_completed, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, TRUE, NOW())
                ON CONFLICT (id) DO UPDATE SET
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    email = EXCLUDED.email,
                    phone = EXCLUDED.phone,
                    updated_at = NOW()
                """,
                (user_id, first_name, last_name or None, email, phone),
            )
            cursor.execute(
                """
                UPDATE public.guest_accounts
                SET pending_email = NULL, upgraded_at = NOW(), last_active_at = NOW()
                WHERE user_id = %s AND upgraded_at IS NULL
                """,
                (user_id,),
            )
            if cursor.rowcount != 1:
                raise LookupError("Guest account could not be upgraded.")

    def cleanup_expired(self, *, orphan_ttl_hours: int) -> int:
        with get_connection() as connection, connection.cursor() as cursor:
            # Reconcile the narrow failure window where Supabase accepted the
            # email OTP but the local completion transaction did not commit.
            # Such a user is permanent and must never be expired as a guest.
            cursor.execute(
                """
                UPDATE public.guest_accounts AS guests
                SET upgraded_at = NOW(), pending_email = NULL, last_active_at = NOW()
                FROM auth.users AS users
                WHERE users.id = guests.user_id
                  AND users.is_anonymous IS FALSE
                  AND guests.upgraded_at IS NULL
                """
            )
            cursor.execute(
                """
                SELECT guests.user_id::text
                FROM public.guest_accounts AS guests
                JOIN auth.users AS users ON users.id = guests.user_id
                WHERE guests.upgraded_at IS NULL
                  AND guests.expires_at <= NOW()
                  AND users.is_anonymous IS TRUE
                FOR UPDATE OF guests SKIP LOCKED
                """
            )
            user_ids = [row[0] for row in cursor.fetchall()]
            cursor.execute(
                """
                SELECT users.id::text
                FROM auth.users AS users
                LEFT JOIN public.guest_accounts AS guests
                  ON guests.user_id = users.id
                WHERE users.is_anonymous IS TRUE
                  AND users.raw_user_meta_data ->> 'guest' = 'true'
                  AND users.created_at <= NOW() - (%s * INTERVAL '1 hour')
                  AND guests.user_id IS NULL
                FOR UPDATE OF users SKIP LOCKED
                """,
                (orphan_ttl_hours,),
            )
            user_ids.extend(row[0] for row in cursor.fetchall())
            user_ids = list(dict.fromkeys(user_ids))
            if not user_ids:
                return 0

            # Editable guest resumes use varchar ownership and therefore do not
            # cascade from auth.users like the UUID profile tables do.
            cursor.execute(
                "DELETE FROM public.resumes WHERE user_id = ANY(%s)",
                (user_ids,),
            )
            cursor.execute(
                "DELETE FROM auth.users WHERE id::text = ANY(%s)",
                (user_ids,),
            )
        return len(user_ids)
