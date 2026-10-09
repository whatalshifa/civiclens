import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api import laws, places
from app.config import get_settings
from app.db import SessionDep, get_session_factory
from app.services.catalog import load_catalog

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if get_settings().load_data_on_start:
        factory = app.dependency_overrides.get(get_session_factory, get_session_factory)()
        try:
            with factory() as session:
                load_catalog(session)
        except Exception:
            # Keep serving whatever data is already loaded rather than not starting at all.
            log.exception("Could not load the data files")
    yield


_public = get_settings().env != "production"  # the interactive API docs are for development only
app = FastAPI(
    title="CivicLens API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if _public else None,
    redoc_url=None,
    openapi_url="/openapi.json" if _public else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_methods=["GET"],
    allow_headers=["Content-Type"],
)

app.include_router(places.router)
app.include_router(laws.router)


@app.get("/api/health")
def health(session: SessionDep) -> dict[str, str]:
    """For the hosting platform's health check: answers only when the database does."""
    try:
        session.execute(text("SELECT 1"))
    except Exception as exc:
        log.exception("Health check: database unreachable")
        raise HTTPException(503, "Database unreachable") from exc
    return {"status": "ok"}
