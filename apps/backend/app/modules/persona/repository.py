from collections.abc import Callable
from contextlib import contextmanager
from typing import Any

import psycopg
from fastapi import HTTPException
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from app.database.connection import get_connection


@contextmanager
def connection():
    try:
        with get_connection() as conn:
            yield conn
    except psycopg.errors.RaiseException as exc:
        raise HTTPException(403, str(exc).splitlines()[0]) from exc
    except (psycopg.Error, RuntimeError) as exc:
        raise HTTPException(
            503,
            detail={
                "code": "persona_unavailable",
                "message": "Personas are temporarily unavailable. Please try again.",
            },
        ) from exc


class PersonaRepository:
    """Every read and write is scoped by authenticated owner, including locks."""

    def list(self, user_id: str) -> list[dict]:
        with connection() as conn, conn.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                "SELECT * FROM personas WHERE user_id = %s ORDER BY created_at DESC, id",
                (user_id,),
            )
            return cursor.fetchall()

    def get(self, user_id: str, persona_id: str) -> dict:
        with connection() as conn, conn.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                "SELECT * FROM personas WHERE user_id = %s AND id = %s",
                (user_id, persona_id),
            )
            return self.require(cursor.fetchone())

    def create(
        self, user_id: str, name: str, description: str, personal: dict | None = None
    ) -> dict:
        data = {
            "personal": personal or {},
            "education": [],
            "experience": [],
            "skills": [],
            "certificates": [],
            "projects": [],
            "social_links": [],
        }
        with connection() as conn, conn.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                "INSERT INTO personas (user_id, name, description, data) VALUES (%s, %s, %s, %s) RETURNING *",
                (user_id, name, description, Jsonb(data)),
            )
            return cursor.fetchone()

    def mutate(
        self, user_id: str, persona_id: str, update: Callable[[dict], None]
    ) -> dict:
        # Serializing changes per persona prevents two category edits from
        # overwriting one another's document snapshot.
        with connection() as conn, conn.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                "SELECT * FROM personas WHERE user_id = %s AND id = %s FOR UPDATE",
                (user_id, persona_id),
            )
            row = self.require(cursor.fetchone())
            update(row)
            cursor.execute(
                "UPDATE personas SET name = %s, description = %s, data = %s, avatar_path = %s, updated_at = NOW() WHERE user_id = %s AND id = %s RETURNING *",
                (
                    row["name"],
                    row["description"],
                    Jsonb(row["data"]),
                    row.get("avatar_path"),
                    user_id,
                    persona_id,
                ),
            )
            return cursor.fetchone()

    def delete(self, user_id: str, persona_id: str) -> dict:
        with connection() as conn, conn.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                "DELETE FROM personas WHERE user_id = %s AND id = %s RETURNING *",
                (user_id, persona_id),
            )
            return self.require(cursor.fetchone())

    @staticmethod
    def require(row: Any) -> dict:
        if row is None:
            raise HTTPException(
                404,
                detail={
                    "code": "persona_not_found",
                    "message": "This persona could not be found.",
                },
            )
        return row
