from supabase import create_client, Client
from config import settings

_client: Client = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return _client


def get_supabase_admin() -> Client:
    """Admin client with service role key — bypasses RLS."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

print("SUPABASE_URL =", settings.SUPABASE_URL)
print("SUPABASE_KEY =", settings.SUPABASE_KEY)