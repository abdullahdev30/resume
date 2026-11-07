"""Operator-only bootstrap. Run from apps/backend after applying migrations."""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.modules.billing.service import database


def main():
    parser = argparse.ArgumentParser(
        description="Promote an existing verified account to super admin."
    )
    parser.add_argument(
        "--email",
        required=True,
        help="Email of the registered and verified operator account",
    )
    args = parser.parse_args()
    with database() as cursor:
        cursor.execute(
            "SELECT id, email_confirmed_at FROM auth.users WHERE lower(email)=lower(%s)",
            (args.email.strip(),),
        )
        user = cursor.fetchone()
        if not user or not user["email_confirmed_at"]:
            parser.error("Register and verify this account before promoting it.")
        cursor.execute(
            """INSERT INTO account_access(user_id, role, active) VALUES (%s,'super_admin',TRUE)
            ON CONFLICT(user_id) DO UPDATE SET role='super_admin', active=TRUE""",
            (user["id"],),
        )
    print("Super admin access enabled. Sign in and open /admin to create packages.")


if __name__ == "__main__":
    main()
