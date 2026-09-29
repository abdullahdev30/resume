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
        return self._fetch_one(
            """
            SELECT id::text AS user_id, first_name AS name, first_name, last_name,
                   father_name, email, phone, address, city, avatar_url,
                   onboarding_completed, created_at, updated_at
            FROM profiles
            WHERE id = %s
            """,
            (user_id,),
        )

    def upsert_personal(
        self,
        user_id: str,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        self._fetch_one(
            """
            INSERT INTO profiles (
                id, first_name, last_name, father_name, email, phone, address,
                city, avatar_url, onboarding_completed, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE, NOW())
            ON CONFLICT (id)
            DO UPDATE SET
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                father_name = EXCLUDED.father_name,
                email = EXCLUDED.email,
                phone = EXCLUDED.phone,
                address = EXCLUDED.address,
                city = EXCLUDED.city,
                avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
                onboarding_completed = TRUE,
                updated_at = NOW()
            RETURNING id
            """,
            (
                user_id,
                payload["first_name"],
                payload.get("last_name"),
                payload.get("father_name"),
                payload["email"],
                payload["phone"],
                payload.get("address"),
                payload.get("city"),
                payload.get("avatar_url"),
            ),
        )

        if payload.get("social_links") is not None:
            self._execute("DELETE FROM social_links WHERE user_id = %s", (user_id,))
            for link in payload["social_links"]:
                self.add_social_link(user_id, link)

        return self.get_personal(user_id) or {}

    def update_avatar(self, user_id: str, avatar_url: str) -> dict[str, Any] | None:
        self._fetch_one(
            """
            UPDATE profiles
            SET avatar_url = %s, updated_at = NOW()
            WHERE id = %s
            RETURNING id
            """,
            (avatar_url, user_id),
        )
        return self.get_personal(user_id)

    def list_social_links(self, user_id: str) -> list[dict[str, Any]]:
        return self.list_items("social_links", user_id)

    def add_social_link(self, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        row = self._fetch_one(
            """
            INSERT INTO social_links (user_id, platform, url)
            VALUES (%s, %s, %s)
            RETURNING id::text AS id, user_id::text AS user_id, platform AS platform_name,
                      url AS profile_url, created_at, updated_at
            """,
            (user_id, payload["platform_name"], payload["profile_url"]),
        )
        return row or {}

    def add_education(self, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        row = self._fetch_one(
            """
            INSERT INTO educations (
                user_id, institution, degree, field_of_study,
                start_date, end_date, description
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id::text AS id, institution AS institute_name, degree, field_of_study,
                      start_date, end_date, (end_date IS NULL) AS is_current,
                      description, NULL::text AS grade, created_at, updated_at
            """,
            (
                user_id,
                payload["institute_name"],
                payload.get("degree"),
                payload.get("field_of_study"),
                payload["start_date"],
                None if payload.get("is_current") else payload.get("end_date"),
                payload.get("description"),
            ),
        )
        return row or {}

    def add_experience(self, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        row = self._fetch_one(
            """
            INSERT INTO experiences (
                user_id, company, position, location, start_date,
                end_date, is_current, description
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id::text AS id, company AS company_name, company AS institute_name,
                      position AS job_title, location, start_date, end_date,
                      is_current, description, created_at, updated_at
            """,
            (
                user_id,
                payload["company_name"],
                payload["job_title"],
                payload.get("location"),
                payload["start_date"],
                None if payload.get("is_current") else payload.get("end_date"),
                payload.get("is_current", False),
                payload.get("description"),
            ),
        )
        return row or {}

    def add_skill(self, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        row = self._fetch_one(
            """
            INSERT INTO skills (user_id, name, skill_name, category, level)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id::text AS id, COALESCE(name, skill_name) AS name,
                      category, level, created_at, updated_at
            """,
            (
                user_id,
                payload["name"],
                payload["name"],
                payload.get("category"),
                payload.get("level"),
            ),
        )
        return row or {}

    def add_certificate(self, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        row = self._fetch_one(
            """
            INSERT INTO certificates (
                user_id, name, issuing_organization, issue_date,
                expiration_date, credential_id, credential_url, file_path
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id::text AS id, name AS title, issuing_organization AS category,
                      credential_id AS field, credential_url AS file_url,
                      file_path AS file_name, issue_date, expiration_date,
                      created_at, updated_at
            """,
            (
                user_id,
                payload["title"],
                payload.get("category"),
                payload.get("issue_date"),
                payload.get("expiration_date"),
                payload.get("field"),
                payload.get("file_url"),
                payload.get("file_name"),
            ),
        )
        return row or {}

    def add_project(self, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        row = self._fetch_one(
            """
            INSERT INTO projects (
                user_id, name, description, url, github_url,
                start_date, end_date, technologies
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id::text AS id, name, description, 'Project'::text AS type,
                      url AS link, github_url, start_date, end_date,
                      technologies, created_at, updated_at
            """,
            (
                user_id,
                payload["name"],
                payload.get("description"),
                payload.get("link"),
                payload.get("github_url"),
                payload.get("start_date"),
                payload.get("end_date"),
                payload.get("technologies"),
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

        if table_name in {"educations", "experiences"} and allowed.get("is_current"):
            allowed["end_date"] = None
        if table_name == "skills" and "name" in allowed:
            allowed["skill_name"] = allowed["name"]

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
                SELECT id::text AS id, user_id::text AS user_id, platform AS platform_name,
                       url AS profile_url, created_at, updated_at
                FROM social_links
                WHERE user_id = %s
            """,
            "educations": """
                SELECT id::text AS id, institution AS institute_name, degree, field_of_study,
                       start_date, end_date, (end_date IS NULL) AS is_current,
                       description, NULL::text AS grade, created_at, updated_at
                FROM educations
                WHERE user_id = %s
            """,
            "experiences": """
                SELECT id::text AS id, company AS company_name, company AS institute_name,
                       position AS job_title, location, start_date, end_date,
                       is_current, description, created_at, updated_at
                FROM experiences
                WHERE user_id = %s
            """,
            "skills": """
                SELECT id::text AS id, COALESCE(name, skill_name) AS name,
                       category, level, created_at, updated_at
                FROM skills
                WHERE user_id = %s
            """,
            "certificates": """
                SELECT id::text AS id, name AS title, issuing_organization AS category,
                       credential_id AS field, credential_url AS file_url,
                       file_path AS file_name, issue_date, expiration_date,
                       created_at, updated_at
                FROM certificates
                WHERE user_id = %s
            """,
            "projects": """
                SELECT id::text AS id, name, description, 'Project'::text AS type,
                       url AS link, github_url, start_date, end_date,
                       technologies, created_at, updated_at
                FROM projects
                WHERE user_id = %s
            """,
        }
        return queries[table_name]

    def _column_map(self, table_name: str) -> dict[str, str]:
        return {
            "social_links": {
                "platform_name": "platform",
                "profile_url": "url",
            },
            "educations": {
                "institute_name": "institution",
                "degree": "degree",
                "field_of_study": "field_of_study",
                "start_date": "start_date",
                "end_date": "end_date",
                "description": "description",
            },
            "experiences": {
                "company_name": "company",
                "institute_name": "company",
                "job_title": "position",
                "location": "location",
                "start_date": "start_date",
                "end_date": "end_date",
                "is_current": "is_current",
                "description": "description",
            },
            "skills": {
                "name": "name",
                "category": "category",
                "level": "level",
            },
            "certificates": {
                "title": "name",
                "category": "issuing_organization",
                "field": "credential_id",
                "file_url": "credential_url",
                "file_name": "file_path",
                "issue_date": "issue_date",
                "expiration_date": "expiration_date",
            },
            "projects": {
                "name": "name",
                "description": "description",
                "link": "url",
                "github_url": "github_url",
                "start_date": "start_date",
                "end_date": "end_date",
                "technologies": "technologies",
            },
        }[table_name]

    def _table_name(self, table: str) -> str:
        if table not in TABLE_ALIASES:
            raise ValueError("Unsupported profile table.")
        return TABLE_ALIASES[table]

    def _fetch_one(
        self,
        query: str,
        params: tuple[Any, ...],
    ) -> dict[str, Any] | None:
        with get_connection() as connection, connection.cursor() as cursor:
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
        with get_connection() as connection, connection.cursor() as cursor:
            cursor.execute(query, params)
            columns = [column.name for column in cursor.description]
            return [
                dict(zip(columns, row, strict=False))
                for row in cursor.fetchall()
            ]

    def _execute(self, query: str, params: tuple[Any, ...]) -> int:
        with get_connection() as connection, connection.cursor() as cursor:
            cursor.execute(query, params)
            return cursor.rowcount
