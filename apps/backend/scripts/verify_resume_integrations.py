"""Opt-in live probes. No existing accounts, records, or objects are modified.

Database tables are temporary and the entire transaction is rolled back.
Storage uses one random verification key and deletes only that object.
AI receives synthetic facts, never a user's persona. Run from apps/backend.
"""

import argparse
import asyncio
import json
import logging
import sys
from pathlib import Path
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from sqlalchemy.schema import CreateTable

from app.core.config import settings
from app.database.connection import _sqlalchemy_url
from app.integrations.s3_storage import S3StorageService
from app.modules.resume.models import Resume
from app.modules.resume.pdf_renderer import PdfRenderer, document_html
from app.modules.resume.repository import ResumeRepository
from app.modules.resume.service import ResumeService


def verify_database() -> None:
    engine = create_engine(
        _sqlalchemy_url(settings.database_url), connect_args={"connect_timeout": 10}
    )
    with engine.connect() as connection:
        transaction = connection.begin()
        try:
            ddl = str(CreateTable(Resume.__table__).compile(connection)).replace(
                "CREATE TABLE resumes", "CREATE TEMP TABLE resumes", 1
            )
            connection.execute(text(ddl))
            connection.execute(
                text(
                    "CREATE TEMP TABLE guest_accounts (user_id uuid, upgraded_at timestamptz)"
                )
            )
            connection.execute(
                text("INSERT INTO guest_accounts VALUES (:id, now())"),
                {"id": str(uuid4())},
            )
            migration = (
                Path(__file__).resolve().parents[1]
                / "app/database/migrations/014_retire_anonymous_workspaces.sql"
            ).read_text()
            for _ in range(2):
                connection.exec_driver_sql(migration.replace("public.", "pg_temp."))
            assert (
                connection.execute(
                    text("SELECT count(*) FROM pg_temp.retired_anonymous_workspaces")
                ).scalar_one()
                == 1
            )
            with Session(
                bind=connection, join_transaction_mode="create_savepoint"
            ) as session:
                repository = ResumeRepository(session)
                owner, resume_id = str(uuid4()), str(uuid4())
                repository.create_document(
                    resume_id=resume_id,
                    user_id=owner,
                    title="Verification",
                    template_id="1",
                    data={"fullName": "Synthetic Candidate"},
                    resume_type="template",
                    is_ai_generated=False,
                )
                assert repository.get("another-owner", resume_id) is None
                assert (
                    repository.update_if_source_version(
                        owner, resume_id, 1, {"source_version": 2}
                    )
                    is not None
                )
                assert (
                    repository.update_if_source_version(
                        owner, resume_id, 1, {"title": "Stale"}
                    )
                    is None
                )
                assert (
                    repository.replace_pdf(
                        owner,
                        resume_id,
                        2,
                        None,
                        {"storage_path": "verification.pdf", "pdf_source_version": 2},
                    )
                    is not None
                )
                assert (
                    repository.replace_pdf(
                        owner, resume_id, 2, None, {"storage_path": "racing.pdf"}
                    )
                    is None
                )
                assert repository.delete(owner, resume_id)
        finally:
            transaction.rollback()
    engine.dispose()


async def verify_storage() -> None:
    storage = S3StorageService()
    key = f"verification/{uuid4()}/resume.pdf"
    pdf = await PdfRenderer().render(
        document_html("<h1>Synthetic verification document</h1>", {}, "Verification")
    )
    uploaded = False
    try:
        await storage.upload_bytes(key, pdf, "application/pdf")
        uploaded = True
        downloaded, _ = await storage.download_bytes(key)
        assert downloaded == pdf
        assert storage.generate_signed_url(
            key, download_name="Verification.pdf"
        ).startswith("https://")
    finally:
        if uploaded:
            await storage.delete_object(key)


async def verify_ai() -> None:
    # Repository is unused when generating an unsaved proposal.
    service = ResumeService(repository=None)
    proposal = await service._generate_ai_document(
        prompt="Write a concise resume using only these supplied facts. Use a classic supported design.",
        job_description=None,
        profile_context={
            "personal": {
                "first_name": "Synthetic",
                "last_name": "Candidate",
                "summary": "Builds software.",
            },
            "skills": [{"name": "Python"}],
        },
        reference_links=[],
    )
    assert proposal.template_id in {str(number) for number in range(1, 11)}
    assert "Synthetic" in proposal.resume_data["fullName"]
    assert not proposal.resume_data["experience"]


async def main() -> None:
    logging.disable(logging.CRITICAL)
    results = {}
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--only", choices=["postgresql_and_migration", "private_storage", "ai_provider"]
    )
    selection = parser.parse_args().only
    for name, check in [
        ("postgresql_and_migration", verify_database),
        ("private_storage", verify_storage),
        ("ai_provider", verify_ai),
    ]:
        if selection and name != selection:
            continue
        try:
            if asyncio.iscoroutinefunction(check):
                await check()
            else:
                await asyncio.to_thread(check)
            results[name] = "passed"
        except Exception as error:  # noqa: BLE001 - redact arbitrary SDK failures
            # Never print exception bodies: network clients may include secrets.
            results[name] = {
                "status": "failed",
                "error_type": type(error).__name__,
                "code": getattr(error, "code", None),
            }
            cause = error.__cause__
            if cause is not None:
                results[name]["cause_type"] = type(cause).__name__
                response = getattr(cause, "response", None)
                if response is not None:
                    results[name]["http_status"] = response.status_code
                    try:
                        provider_error = response.json().get("error", {})
                        results[name]["provider_error_code"] = provider_error.get(
                            "code"
                        )
                        results[name]["provider_error_type"] = provider_error.get(
                            "type"
                        )
                    except (ValueError, AttributeError):
                        pass
    print(json.dumps(results, indent=2))
    if any(value != "passed" for value in results.values()):
        raise SystemExit(1)


if __name__ == "__main__":
    asyncio.run(main())
