from supabase import Client, ClientOptions, create_client

from app.core.config import settings


def create_supabase_client() -> Client:
    return create_client(
        settings.supabase_url,
        settings.supabase_publishable_key,
        options=ClientOptions(
            auto_refresh_token=False,
            persist_session=False,
        ),
    )
