import asyncio
import logging

from app.core.config import settings
from app.modules.auth.guest_repository import GuestAccountRepository

logger = logging.getLogger(__name__)


def cleanup_expired_guests() -> int:
    deleted = GuestAccountRepository().cleanup_expired(
        orphan_ttl_hours=settings.guest_session_ttl_hours,
    )
    if deleted:
        logger.info("Deleted %s expired guest account(s).", deleted)
    return deleted


async def run_guest_cleanup_loop() -> None:
    interval_seconds = max(60, settings.guest_cleanup_interval_minutes * 60)
    while True:
        try:
            await asyncio.to_thread(cleanup_expired_guests)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Expired guest cleanup failed; it will be retried.")
        await asyncio.sleep(interval_seconds)
