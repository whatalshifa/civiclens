import os

# Tests need a real Postgres (search is a Postgres feature). CI starts one; locally, point
# CL_DATABASE_URL at an empty database you don't mind being wiped.
os.environ.setdefault("CL_DATABASE_URL", "postgresql+psycopg://postgres@localhost:5432/civiclens_test")
os.environ["CL_LOAD_DATA_ON_START"] = "false"  # the fixtures below load it once instead
os.environ["ANTHROPIC_API_KEY"] = ""
os.environ["CL_DEMO_STEP_DELAY"] = "0"

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.db import Base, SessionLocal, engine
from app.main import app
from app.services.catalog import load_catalog


@pytest.fixture(scope="session", autouse=True)
def database():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal() as session:
        load_catalog(session, force=True)
    yield
    engine.dispose()


@pytest.fixture
def session():
    with SessionLocal() as s:
        yield s


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    get_settings.cache_clear()
