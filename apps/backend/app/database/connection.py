from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Settings se database URL lein (fallback ke sath)
DATABASE_URL = getattr(settings, "database_url", None) or "sqlite:///./database.db"

# SQLAlchemy engine create karein
engine = create_engine(
    DATABASE_URL, 
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