"""How well the rights assistant's citations hold up, from the run log. No questions are stored."""

from datetime import date

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select

from app.api.guard import require_proxy
from app.db import SessionDep
from app.models import AssistantRun

router = APIRouter(prefix="/api", tags=["accuracy"], dependencies=[Depends(require_proxy)])


class ModeStats(BaseModel):
    mode: str  # "ai" (live answers) or "demo" (prepared samples replayed through the real tools)
    runs: int
    answered: int
    failed: int  # errors, refusals and answers that ran too long; abandoned runs aren't counted
    citations: int  # citations checked against the sections read, and kept
    dropped: int  # citations removed because the assistant hadn't read that section
    first_run: date | None


class AccuracyOut(BaseModel):
    modes: list[ModeStats]


@router.get("/accuracy", response_model=AccuracyOut)
def accuracy(session: SessionDep) -> AccuracyOut:
    rows = session.execute(
        select(
            AssistantRun.mode,
            func.count(),
            func.count().filter(AssistantRun.outcome == "answered"),
            func.count().filter(AssistantRun.outcome.in_(("error", "refusal", "too_long"))),
            func.coalesce(func.sum(AssistantRun.citations), 0),
            func.coalesce(func.sum(AssistantRun.dropped_citations), 0),
            func.min(func.date(func.timezone("Asia/Kolkata", AssistantRun.created_at))),
        )
        .where(AssistantRun.mode.in_(("ai", "demo")), AssistantRun.outcome != "abandoned")
        .group_by(AssistantRun.mode)
    ).all()
    fields = ("mode", "runs", "answered", "failed", "citations", "dropped", "first_run")
    found = {row[0]: ModeStats(**dict(zip(fields, row, strict=True))) for row in rows}
    empty = dict(runs=0, answered=0, failed=0, citations=0, dropped=0, first_run=None)
    return AccuracyOut(modes=[found.get(mode) or ModeStats(mode=mode, **empty) for mode in ("ai", "demo")])
