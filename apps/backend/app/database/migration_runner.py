from pathlib import Path

from app.database.connection import get_connection

MIGRATIONS_DIR = Path(__file__).resolve().parent / "migrations"


def run_migrations() -> list[str]:
    applied_now: list[str] = []

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    version VARCHAR(100) PRIMARY KEY,
                    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            )
            cursor.execute("SELECT version FROM schema_migrations;")
            applied = {row[0] for row in cursor.fetchall()}

            for migration in sorted(MIGRATIONS_DIR.glob("*.sql")):
                version = migration.stem
                if version in applied:
                    continue

                cursor.execute(migration.read_text(encoding="utf-8"))
                cursor.execute(
                    "INSERT INTO schema_migrations (version) VALUES (%s);",
                    (version,),
                )
                applied_now.append(version)

        connection.commit()

    return applied_now
