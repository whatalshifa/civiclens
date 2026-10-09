"""All settings in one place, read from environment variables (or a .env file).

Nothing secret is hard-coded: the database URL and (later) the AI key come from the
environment, so the same code runs on a laptop, in CI and on a server.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_prefix="CL_", extra="ignore", populate_by_name=True
    )

    env: Literal["development", "production"] = "development"

    # CivicLens needs Postgres everywhere (its full-text search is a Postgres feature), so there is
    # no SQLite fallback. Locally: `docker compose up db`, or any Postgres 16+.
    database_url: str = "postgresql+psycopg://civiclens:civiclens@localhost:5432/civiclens"

    # Read from ANTHROPIC_API_KEY (no CL_ prefix), the name every Anthropic tool uses. Without it
    # the rights assistant runs in demo mode: it replays prepared answers to sample questions.
    anthropic_api_key: str | None = Field(default=None, validation_alias="ANTHROPIC_API_KEY")
    claude_model: str = "claude-opus-5-5"
    assistant_effort: Literal["low", "medium", "high"] = "medium"
    # The most rounds of tool calls one answer may take before the assistant must answer.
    assistant_max_rounds: int = 8

    # Spending guards for the AI: per visitor's network, and for the whole site per day.
    assistant_per_ip_per_hour: int = 10
    assistant_runs_per_day: int = 200

    # Pause between replayed steps in demo mode, so a sample unfolds like a live answer.
    demo_step_delay: float = 0.5

    # The web app's address, for local tools that call the API directly. The website itself
    # forwards /api/* on its own address, so browsers never need this.
    cors_origins: list[str] = ["http://localhost:3000"]

    # A shared secret the website sends with every request it forwards. When set, the API refuses
    # requests that don't carry it, so the API is only reachable through the website.
    proxy_secret: str = ""

    # Load the data files (app/data) into the database when the API starts, if they changed.
    load_data_on_start: bool = True

    @field_validator("database_url")
    @classmethod
    def _use_psycopg(cls, url: str) -> str:
        # Neon and Render hand out "postgres://" or "postgresql://" URLs. SQLAlchemy reads those as
        # the old psycopg2 driver, so point them at psycopg 3, which is what we install.
        for prefix in ("postgres://", "postgresql://"):
            if url.startswith(prefix):
                return "postgresql+psycopg://" + url[len(prefix) :]
        return url

    @property
    def ai_enabled(self) -> bool:
        return bool(self.anthropic_api_key and self.anthropic_api_key.strip())


@lru_cache
def get_settings() -> Settings:
    return Settings()
