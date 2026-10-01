from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Select, select
from sqlalchemy import update as sql_update
from sqlalchemy.orm import Session

from app.modules.resume.models import Resume, ResumeStorageCleanup


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
        file_name: str | None = None,
        storage_path: str | None = None,
        mime_type: str | None = None,
        file_size: int | None = None,
        template_id: str | None = None,
        data: dict[str, Any] | None = None,
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
        resume_type: str,
        is_ai_generated: bool,
    ) -> Resume:
        return self.create(
            resume_id=resume_id,
            user_id=user_id,
            title=title,
            template_id=template_id,
            data=data,
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

    def update_if_source_version(
        self,
        user_id: str,
        resume_id: str,
        expected_version: int,
        values: dict[str, Any],
    ) -> Resume | None:
        next_values = {**values, "updated_at": datetime.now(timezone.utc)}
        try:
            result = self.session.execute(
                sql_update(Resume)
                .where(
                    Resume.id == resume_id,
                    Resume.user_id == user_id,
                    Resume.source_version == expected_version,
                )
                .values(**next_values)
            )
            if result.rowcount != 1:
                self.session.rollback()
                return None
            self.session.commit()
        except Exception:
            self.session.rollback()
            raise
        return self.get(user_id, resume_id)

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

    def enqueue_storage_cleanup(
        self,
        *,
        storage_path: str,
        user_id: str,
        last_error: str,
    ) -> None:
        now = datetime.now(timezone.utc)
        record = self.session.get(ResumeStorageCleanup, storage_path)
        if record is None:
            record = ResumeStorageCleanup(
                storage_path=storage_path,
                user_id=user_id,
                last_error=last_error,
                created_at=now,
                updated_at=now,
            )
            self.session.add(record)
        else:
            record.last_error = last_error
            record.updated_at = now
        try:
            self.session.commit()
        except Exception:
            self.session.rollback()
            raise

    def _scoped_query(self, user_id: str) -> Select[tuple[Resume]]:
        return select(Resume).where(
            Resume.user_id == user_id,
        )
