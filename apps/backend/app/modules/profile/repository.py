import sqlite3
import threading
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from app.core.config import settings


class ProfileRepository:
    def __init__(self, database_path: str | None = None) -> None:
        self.database_path = database_path or settings.profile_database_path
        self._lock = threading.RLock()
        self._ensure_database()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        return connection

    def _ensure_database(self) -> None:
        database_parent = Path(self.database_path).parent
        if str(database_parent) != ".":
            database_parent.mkdir(parents=True, exist_ok=True)

        with self._lock, self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS profile_personal (
                    user_id TEXT PRIMARY KEY,
                    first_name TEXT NOT NULL,
                    last_name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    address TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS profile_social_links (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    platform_name TEXT NOT NULL,
                    profile_url TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS profile_education (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    institute_name TEXT NOT NULL,
                    field_of_study TEXT NOT NULL,
                    start_date TEXT NOT NULL,
                    end_date TEXT,
                    grade TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS profile_experience (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    institute_name TEXT NOT NULL,
                    job_title TEXT NOT NULL,
                    start_date TEXT NOT NULL,
                    end_date TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS profile_skills (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS profile_certificates (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    category TEXT NOT NULL,
                    field TEXT NOT NULL,
                    file_url TEXT,
                    file_name TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS profile_projects (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL,
                    type TEXT NOT NULL,
                    link TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                """
            )

    def get_personal(self, user_id: str) -> dict[str, Any] | None:
        with self._lock, self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM profile_personal WHERE user_id = ?",
                (user_id,),
            ).fetchone()
        return self._row_to_dict(row)

    def upsert_personal(
        self,
        user_id: str,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        now = self._now()
        existing = self.get_personal(user_id)

        with self._lock, self._connect() as connection:
            if existing:
                connection.execute(
                    """
                    UPDATE profile_personal
                    SET first_name = ?, last_name = ?, email = ?, phone = ?,
                        address = ?, updated_at = ?
                    WHERE user_id = ?
                    """,
                    (
                        payload["first_name"],
                        payload["last_name"],
                        payload["email"],
                        payload["phone"],
                        payload["address"],
                        now,
                        user_id,
                    ),
                )
            else:
                connection.execute(
                    """
                    INSERT INTO profile_personal (
                        user_id, first_name, last_name, email, phone, address,
                        created_at, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        user_id,
                        payload["first_name"],
                        payload["last_name"],
                        payload["email"],
                        payload["phone"],
                        payload["address"],
                        now,
                        now,
                    ),
                )

            if "social_links" in payload and payload["social_links"] is not None:
                connection.execute(
                    "DELETE FROM profile_social_links WHERE user_id = ?",
                    (user_id,),
                )
                for link in payload["social_links"]:
                    self._insert_social_link(connection, user_id, link, now)

        return self.get_personal(user_id) or {}

    def list_social_links(self, user_id: str) -> list[dict[str, Any]]:
        return self._list_by_user("profile_social_links", user_id)

    def add_social_link(
        self,
        user_id: str,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        now = self._now()
        item_id = str(uuid4())
        record = {
            "id": item_id,
            "user_id": user_id,
            "platform_name": payload["platform_name"],
            "profile_url": payload["profile_url"],
            "created_at": now,
            "updated_at": now,
        }
        with self._lock, self._connect() as connection:
            connection.execute(
                """
                INSERT INTO profile_social_links (
                    id, user_id, platform_name, profile_url, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                tuple(record.values()),
            )
        return record

    def add_education(
        self,
        user_id: str,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        return self._insert_item(
            "profile_education",
            user_id,
            payload,
            ["institute_name", "field_of_study", "start_date", "end_date", "grade"],
        )

    def add_experience(
        self,
        user_id: str,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        return self._insert_item(
            "profile_experience",
            user_id,
            payload,
            ["institute_name", "job_title", "start_date", "end_date"],
        )

    def add_skill(self, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        return self._insert_item("profile_skills", user_id, payload, ["name"])

    def add_certificate(
        self,
        user_id: str,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        return self._insert_item(
            "profile_certificates",
            user_id,
            payload,
            ["title", "category", "field", "file_url", "file_name"],
        )

    def add_project(self, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        return self._insert_item(
            "profile_projects",
            user_id,
            payload,
            ["name", "description", "type", "link"],
        )

    def list_items(self, table: str, user_id: str) -> list[dict[str, Any]]:
        return self._list_by_user(table, user_id)

    def get_item(
        self,
        table: str,
        user_id: str,
        item_id: str,
    ) -> dict[str, Any] | None:
        with self._lock, self._connect() as connection:
            row = connection.execute(
                f"SELECT * FROM {table} WHERE user_id = ? AND id = ?",
                (user_id, item_id),
            ).fetchone()
        return self._row_to_dict(row)

    def update_item(
        self,
        table: str,
        user_id: str,
        item_id: str,
        payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        allowed = {
            key: value
            for key, value in payload.items()
            if key not in {"id", "user_id", "created_at", "updated_at"}
        }
        if not allowed:
            return self.get_item(table, user_id, item_id)

        allowed["updated_at"] = self._now()
        assignments = ", ".join(f"{key} = ?" for key in allowed)
        values = list(allowed.values()) + [user_id, item_id]

        with self._lock, self._connect() as connection:
            cursor = connection.execute(
                f"UPDATE {table} SET {assignments} WHERE user_id = ? AND id = ?",
                values,
            )
            if cursor.rowcount == 0:
                return None

        return self.get_item(table, user_id, item_id)

    def delete_item(self, table: str, user_id: str, item_id: str) -> bool:
        with self._lock, self._connect() as connection:
            cursor = connection.execute(
                f"DELETE FROM {table} WHERE user_id = ? AND id = ?",
                (user_id, item_id),
            )
        return cursor.rowcount > 0

    def _insert_item(
        self,
        table: str,
        user_id: str,
        payload: dict[str, Any],
        fields: list[str],
    ) -> dict[str, Any]:
        now = self._now()
        record = {
            "id": str(uuid4()),
            "user_id": user_id,
            **{field: payload.get(field) for field in fields},
            "created_at": now,
            "updated_at": now,
        }

        columns = list(record)
        placeholders = ", ".join("?" for _ in columns)

        with self._lock, self._connect() as connection:
            connection.execute(
                f"""
                INSERT INTO {table} ({", ".join(columns)})
                VALUES ({placeholders})
                """,
                [record[column] for column in columns],
            )

        return record

    def _insert_social_link(
        self,
        connection: sqlite3.Connection,
        user_id: str,
        payload: dict[str, Any],
        now: str,
    ) -> None:
        connection.execute(
            """
            INSERT INTO profile_social_links (
                id, user_id, platform_name, profile_url, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                str(uuid4()),
                user_id,
                payload["platform_name"],
                payload["profile_url"],
                now,
                now,
            ),
        )

    def _list_by_user(self, table: str, user_id: str) -> list[dict[str, Any]]:
        with self._lock, self._connect() as connection:
            rows = connection.execute(
                f"SELECT * FROM {table} WHERE user_id = ? ORDER BY created_at ASC",
                (user_id,),
            ).fetchall()
        return [dict(row) for row in rows]

    def _row_to_dict(self, row: sqlite3.Row | None) -> dict[str, Any] | None:
        if row is None:
            return None
        return dict(row)

    def _now(self) -> str:
        return datetime.now(UTC).isoformat()
