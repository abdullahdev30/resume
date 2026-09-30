from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.modules.resume.models import Resume


class ResumeRepository:
    """Database access for resume metadata and editable source.

    The repository only knows about the database. Every statement is scoped to
    the authenticated ``user_id``, so a caller can never read or mutate another
    user's resume.
    """

    def __init__(self, session: Session) -> None:
        self.session = session

    def create(
        self,
        *,
        resume_id: str,
        user_id: str,
        title: str,
        file_name: str,
        storage_path: str,
        mime_type: str,
        file_size: int,
        template_id: str | None = None,
        data: dict[str, Any] | None = None,
        html_content: str | None = None,
        resume_type: str = "legacy_pdf",
        is_ai_generated: bool = False,
    ) -> Resume:
        now = datetime.now(timezone.utc)
        resume = Resume(
            id=resume_id,
            user_id=user_id,
            title=title,
            file_name=file_name,
            storage_path=storage_path,
            mime_type=mime_type,
            file_size=file_size,
            template_id=template_id,
            data=data,
            html_content=html_content,
            resume_type=resume_type,
            source_version=1,
            is_ai_generated=is_ai_generated,
            created_at=now,
            updated_at=now,
        )
        try:
            self.session.add(resume)
            self.session.commit()
        except Exception:
            self.session.rollback()
            raise
        self.session.refresh(resume)
        return resume

    def create_document(
        self,
        *,
        resume_id: str,
        user_id: str,
        title: str,
        template_id: str | None,
        data: dict[str, Any],
        html_content: str,
        storage_path: str,
        file_name: str,
        file_size: int,
        resume_type: str,
        is_ai_generated: bool,
    ) -> Resume:
        return self.create(
            resume_id=resume_id,
            user_id=user_id,
            title=title,
            file_name=file_name,
            storage_path=storage_path,
            mime_type="application/pdf",
            file_size=file_size,
            template_id=template_id,
            data=data,
            html_content=html_content,
            resume_type=resume_type,
            is_ai_generated=is_ai_generated,
        )

    def get(self, user_id: str, resume_id: str) -> Resume | None:
        return self.session.scalar(
            self._scoped_query(user_id).where(Resume.id == resume_id)
        )

    def list(self, user_id: str) -> list[Resume]:
        query = self._scoped_query(user_id).order_by(
            Resume.created_at.desc(),
            Resume.id.desc(),
        )
        return list(self.session.scalars(query))

    def update(
        self,
        user_id: str,
        resume_id: str,
        values: dict[str, Any],
    ) -> Resume | None:
        resume = self.get(user_id, resume_id)
        if resume is None:
            return None

        for field, value in values.items():
            setattr(resume, field, value)
        resume.updated_at = datetime.now(timezone.utc)

        try:
            self.session.commit()
        except Exception:
            self.session.rollback()
            raise
        self.session.refresh(resume)
        return resume

    def delete(self, user_id: str, resume_id: str) -> bool:
        resume = self.get(user_id, resume_id)
        if resume is None:
            return False

        try:
            self.session.delete(resume)
            self.session.commit()
        except Exception:
            self.session.rollback()
            raise
        return True

    def _scoped_query(self, user_id: str) -> Select[tuple[Resume]]:
        return select(Resume).where(
            Resume.user_id == user_id,
        )
