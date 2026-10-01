"""Make one real AI resume call without starting the web UI.

Run from apps/backend with: python scripts/test_ai.py
"""

import asyncio
import json
import os
import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
# This diagnostic never accesses persistence. Keeping its import path on an
# in-memory SQLite URL prevents a local PostgreSQL driver from becoming an
# unrelated prerequisite for checking the AI provider configuration.
os.environ["DATABASE_URL"] = "sqlite://"

from app.modules.resume.service import ResumeService


async def main() -> None:
    service = ResumeService(repository=None)  # type: ignore[arg-type]
    service._ensure_ai_configured()
    result = await service._generate_with_ai_provider(
        prompt="Create a concise backend engineer resume using only the supplied facts.",
        job_description="Backend engineer working on reliable Python APIs.",
        profile_context={
            "personal": {
                "first_name": "Test",
                "last_name": "Candidate",
                "professional_title": "Backend Engineer",
            },
            "skills": [{"name": "Python", "category": "Backend"}],
        },
        reference_links=[],
        existing_data=None,
    )
    print("AI call succeeded")
    print(json.dumps(result.model_dump(mode="json", by_alias=True), indent=2))


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except httpx.HTTPStatusError as exc:
        print(f"AI call failed: HTTP {exc.response.status_code}")
        print(exc.response.text[:500])
        raise SystemExit(1) from exc
