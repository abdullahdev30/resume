from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any

from app.core.config import settings


@contextmanager
def get_connection() -> Iterator[Any]:
    if not settings.database_url:
      raise RuntimeError("DATABASE_URL is required for PostgreSQL access.")

    try:
        import psycopg
    except ImportError as exc:
        raise RuntimeError("Install psycopg to use PostgreSQL access.") from exc

    with psycopg.connect(settings.database_url) as connection:
        yield connection
