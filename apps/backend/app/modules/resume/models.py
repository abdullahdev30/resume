# backend/app/modules/resume/models.py
from sqlalchemy import JSON, BigInteger, Boolean, Column, DateTime, String, Text

from app.database.connection import Base


class Resume(Base):
    """Metadata for an uploaded PDF resume.

    The ``public.resumes`` table is shared with editor generated resume
    documents (``template_id`` + ``data``). Uploaded PDF resumes are the rows
    that carry a ``storage_path``; the repository always filters on that column
    so the two kinds of resume never mix.
    """

    __tablename__ = "resumes"

    id = Column(String(255), primary_key=True)
    user_id = Column(String(255), index=True, nullable=True)
    title = Column(String(255), nullable=False)

    file_name = Column(Text, nullable=True)
    storage_path = Column(Text, nullable=True)
    mime_type = Column(Text, nullable=True)
    file_size = Column(BigInteger, nullable=True)

    # Owned by the editor / AI resume flow, unused for PDF uploads.
    template_id = Column(String(255), nullable=True)
    data = Column(JSON, nullable=True)
    is_ai_generated = Column(Boolean, nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)
