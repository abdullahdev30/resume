import psycopg
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

# Settings se database URL lein (fallback ke sath)
DATABASE_URL = getattr(settings, "database_url", None) or "sqlite:///./database.db"

def _sqlalchemy_url(database_url: str) -> str:
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    return database_url


# SQLAlchemy engine create karein
engine = create_engine(
    _sqlalchemy_url(DATABASE_URL),
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# FastAPI ke liye get_db function jo aapka router dhoond raha hai
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_connection():
    """Blocking PostgreSQL connection for raw SQL (migrations, SQL repositories).

    Used by ``app.database.migration_runner`` and by repositories that execute
    hand written SQL against Supabase/Postgres.
    """
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL must be configured to run raw SQL.")

    return psycopg.connect(settings.database_url)
