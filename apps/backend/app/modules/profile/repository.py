from typing import Any

from app.database.connection import get_connection


TABLE_ALIASES = {
    "profile_social_links": "social_links",
    "profile_education": "educations",
    "profile_experience": "experiences",
    "profile_skills": "skills",
    "profile_certificates": "certificates",
    "profile_projects": "projects",
    "social_links": "social_links",
    "educations": "educations",
    "experiences": "experiences",
    "skills": "skills",
    "certificates": "certificates",
    "projects": "projects",
}


class ProfileRepository:
    def __init__(self, database_url: str | None = None) -> None:
        self.database_url = database_url

    def get_personal(self, user_id: str) -> dict[str, Any] | None:
        row = self._fetch_one(
            """
            SELECT id AS user_id, first_name, last_name, email, phone, address,
                   created_at, updated_at
            FROM profiles
            WHERE id = %s
            """,
            (user_id,),
        )
        return row

    def upsert_personal(
        self,
        user_id: str,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        self._fetch_one(
            """
            INSERT INTO profiles (
                id, first_name, last_name, email, phone, address,
                onboarding_completed, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, TRUE, NOW())
            ON CONFLICT (id)
            DO UPDATE SET
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                email = EXCLUDED.email,
                phone = EXCLUDED.phone,
                address = EXCLUDED.address,
                onboarding_completed = TRUE,
                updated_at = NOW()
            RETURNING id
            """,
            (
                user_id,
                payload["first_name"],
                payload["last_name"],
                payload["email"],
                payload["phone"],
                payload["address"],
            ),
        )

        if "social_links" in payload and payload["social_links"] is not None:
            self._execute(
                "DELETE FROM social_links WHERE user_id = %s",
                (user_id,),
            )
            for link in payload["social_links"]:
                self.add_social_link(user_id, link)

        return self.get_personal(user_id) or {}

    def list_social_links(self, user_id: str) -> list[dict[str, Any]]:
        return self.list_items("social_links", user_id)

    def add_social_link(
        self,
        user_id: str,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        row = self._fetch_one(
            """
            INSERT INTO social_links (user_id, platform, url)
            VALUES (%s, %s, %s)
            RETURNING id, user_id, platform AS platform_name, url AS profile_url,
                      created_at, updated_at
            """,
            (user_id, payload["platform_name"], payload["profile_url"]),
        )
        return row or {}

    def add_education(
        self,
        user_id: str,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        row = self._fetch_one(
            """
            INSERT INTO educations (
                user_id, institution, field_of_study, start_date, end_date
            )
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, institution AS institute_name, field_of_study,
                      start_date, end_date, NULL::text AS grade,
                      created_at, updated_at
            """,
            (
                user_id,
                payload["institute_name"],
                payload["field_of_study"],
                payload["start_date"],
                payload.get("end_date"),
            ),
        )
        return row or {}

    def add_experience(
        self,
        user_id: str,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        row = self._fetch_one(
            """
            INSERT INTO experiences (user_id, company, position, start_date, end_date)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, company AS institute_name, position AS job_title,
                      start_date, end_date, created_at, updated_at
            """,
            (
                user_id,
                payload["institute_name"],
                payload["job_title"],
                payload["start_date"],
                payload.get("end_date"),
            ),
        )
        return row or {}

    def add_skill(self, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        row = self._fetch_one(
            """
            INSERT INTO skills (user_id, name)
            VALUES (%s, %s)
            RETURNING id, name, created_at, updated_at
            """,
            (user_id, payload["name"]),
        )
        return row or {}

    def add_certificate(
        self,
        user_id: str,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        row = self._fetch_one(
            """
            INSERT INTO certificates (
                user_id, name, issuing_organization, credential_id,
                credential_url, file_path
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, name AS title, issuing_organization AS category,
                      credential_id AS field, credential_url AS file_url,
                      file_path AS file_name, created_at, updated_at
            """,
            (
                user_id,
                payload["title"],
                payload["category"],
                payload["field"],
                payload.get("file_url"),
                payload.get("file_name"),
            ),
        )
        return row or {}

    def add_project(self, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        row = self._fetch_one(
            """
            INSERT INTO projects (user_id, name, description, url)
            VALUES (%s, %s, %s, %s)
            RETURNING id, name, description, 'Web'::text AS type, url AS link,
                      created_at, updated_at
            """,
            (
                user_id,
                payload["name"],
                payload["description"],
                payload.get("link"),
            ),
        )
        return row or {}

    def list_items(self, table: str, user_id: str) -> list[dict[str, Any]]:
        table_name = self._table_name(table)
        query = self._select_query(table_name) + " ORDER BY created_at ASC"
        return self._fetch_all(query, (user_id,))

    def get_item(
        self,
        table: str,
        user_id: str,
        item_id: str,
    ) -> dict[str, Any] | None:
        table_name = self._table_name(table)
        query = self._select_query(table_name) + " AND id = %s"
        return self._fetch_one(query, (user_id, item_id))

    def update_item(
        self,
        table: str,
        user_id: str,
        item_id: str,
        payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        table_name = self._table_name(table)
        column_map = self._column_map(table_name)
        allowed = {
            column_map[key]: value
            for key, value in payload.items()
            if key in column_map
        }
        if not allowed:
            return self.get_item(table_name, user_id, item_id)

        assignments = ", ".join(f"{column} = %s" for column in allowed)
        values = [*allowed.values(), user_id, item_id]
        row = self._fetch_one(
            f"""
            UPDATE {table_name}
            SET {assignments}, updated_at = NOW()
            WHERE user_id = %s AND id = %s
            RETURNING id
            """,
            tuple(values),
        )
        if row is None:
            return None
        return self.get_item(table_name, user_id, item_id)

    def delete_item(self, table: str, user_id: str, item_id: str) -> bool:
        table_name = self._table_name(table)
        return (
            self._execute(
                f"DELETE FROM {table_name} WHERE user_id = %s AND id = %s",
                (user_id, item_id),
            )
            > 0
        )

    def _select_query(self, table_name: str) -> str:
        queries = {
            "social_links": """
                SELECT id, user_id, platform AS platform_name,
                       url AS profile_url, created_at, updated_at
                FROM social_links
                WHERE user_id = %s
            """,
            "educations": """
                SELECT id, institution AS institute_name, field_of_study,
                       start_date, end_date, NULL::text AS grade,
                       created_at, updated_at
                FROM educations
                WHERE user_id = %s
            """,
            "experiences": """
                SELECT id, company AS institute_name, position AS job_title,
                       start_date, end_date, created_at, updated_at
                FROM experiences
                WHERE user_id = %s
            """,
            "skills": """
                SELECT id, name, created_at, updated_at
                FROM skills
                WHERE user_id = %s
            """,
            "certificates": """
                SELECT id, name AS title, issuing_organization AS category,
                       credential_id AS field, credential_url AS file_url,
                       file_path AS file_name, created_at, updated_at
                FROM certificates
                WHERE user_id = %s
            """,
            "projects": """
                SELECT id, name, description, 'Web'::text AS type, url AS link,
                       created_at, updated_at
                FROM projects
                WHERE user_id = %s
            """,
        }
        return queries[table_name]

    def _column_map(self, table_name: str) -> dict[str, str]:
        maps = {
            "social_links": {
                "platform_name": "platform",
                "profile_url": "url",
            },
            "educations": {
                "institute_name": "institution",
                "field_of_study": "field_of_study",
                "start_date": "start_date",
                "end_date": "end_date",
            },
            "experiences": {
                "institute_name": "company",
                "job_title": "position",
                "start_date": "start_date",
                "end_date": "end_date",
            },
            "skills": {"name": "name"},
            "certificates": {
                "title": "name",
                "category": "issuing_organization",
                "field": "credential_id",
                "file_url": "credential_url",
                "file_name": "file_path",
            },
            "projects": {
                "name": "name",
                "description": "description",
                "link": "url",
            },
        }
        return maps[table_name]

    def _table_name(self, table: str) -> str:
        if table not in TABLE_ALIASES:
            raise ValueError("Unsupported profile table.")
        return TABLE_ALIASES[table]

    def _fetch_one(
        self,
        query: str,
        params: tuple[Any, ...],
    ) -> dict[str, Any] | None:
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(query, params)
                row = cursor.fetchone()
                if row is None:
                    return None
                columns = [column.name for column in cursor.description]
                return dict(zip(columns, row, strict=False))

    def _fetch_all(
        self,
        query: str,
        params: tuple[Any, ...],
    ) -> list[dict[str, Any]]:
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(query, params)
                columns = [column.name for column in cursor.description]
                return [
                    dict(zip(columns, row, strict=False))
                    for row in cursor.fetchall()
                ]

    def _execute(self, query: str, params: tuple[Any, ...]) -> int:
        with get_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.rowcount
