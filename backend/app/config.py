import os
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

# Env var names the Neon/Vercel Postgres integrations may inject, in priority order.
# We prefer the non-pooling/unpooled URL for short-lived serverless invocations.
_DB_ENV_CANDIDATES = (
    "DATABASE_URL",
    "POSTGRES_URL",
    "DATABASE_URL_UNPOOLED",
    "POSTGRES_URL_NON_POOLING",
    "POSTGRES_PRISMA_URL",
)


def _resolve_database_url() -> str:
    for name in _DB_ENV_CANDIDATES:
        value = os.getenv(name)
        if value:
            return value
    # Local zero-config fallback. NOTE: not usable on read-only serverless FS.
    return "sqlite:///./cursor_northampton.db"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = _resolve_database_url()

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 12

    admin_email: str = "admin@cursornorthampton.dev"
    admin_password: str = "admin1234"

    frontend_origin: str = "http://localhost:5173"


@lru_cache
def get_settings() -> Settings:
    return Settings()
