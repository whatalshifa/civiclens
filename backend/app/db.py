from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings


class Base(DeclarativeBase):
    pass


engine = create_engine(get_settings().database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


def get_session_factory() -> sessionmaker[Session]:
    return SessionLocal


def get_session(factory: Annotated[sessionmaker[Session], Depends(get_session_factory)]) -> Iterator[Session]:
    """FastAPI dependency: one database session per request."""
    with factory() as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]
