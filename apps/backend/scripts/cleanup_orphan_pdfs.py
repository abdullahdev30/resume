"""Remove private resume PDFs that have no database row and are older than 24h.

Run from apps/backend:
    python scripts/cleanup_orphan_pdfs.py --dry-run
    python scripts/cleanup_orphan_pdfs.py
"""

import argparse
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database.connection import get_connection
from app.integrations.s3_storage import S3StorageService


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List orphaned PDFs without deleting them.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    storage = S3StorageService()
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)

    with get_connection() as connection, connection.cursor() as cursor:
        cursor.execute(
            "SELECT storage_path FROM resumes WHERE storage_path IS NOT NULL"
        )
        active_paths = {row[0] for row in cursor.fetchall()}

        paginator = storage.client.get_paginator("list_objects_v2")
        candidates: list[str] = []
        for page in paginator.paginate(Bucket=storage.bucket_name):
            for item in page.get("Contents", []):
                key = item.get("Key")
                modified = item.get("LastModified")
                if (
                    isinstance(key, str)
                    and key.endswith(".pdf")
                    and key not in active_paths
                    and isinstance(modified, datetime)
                    and modified <= cutoff
                ):
                    candidates.append(key)

        for key in candidates:
            action = "would delete" if args.dry_run else "deleting"
            print(f"{action}: {key}")
            if args.dry_run:
                continue
            storage.client.delete_object(Bucket=storage.bucket_name, Key=key)
            cursor.execute(
                "DELETE FROM resume_storage_cleanup WHERE storage_path = %s",
                (key,),
            )
        if not args.dry_run:
            connection.commit()

    print(f"orphan PDFs found: {len(candidates)}")


if __name__ == "__main__":
    main()
