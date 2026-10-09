"""The rights assistant's API: sample questions, and a question answered as a live stream of steps."""

import json
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from functools import lru_cache
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session, sessionmaker

from app.api.guard import require_proxy
from app.config import Settings, get_settings
from app.db import SessionDep, get_session_factory
from app.models import AssistantRun
from app.services import assistant
from app.services.ratelimit import RateLimiter, client_ip

router = APIRouter(prefix="/api/assistant", tags=["assistant"], dependencies=[Depends(require_proxy)])

SettingsDep = Annotated[Settings, Depends(get_settings)]
FactoryDep = Annotated[sessionmaker[Session], Depends(get_session_factory)]


@lru_cache
def _limiter() -> RateLimiter:
    return RateLimiter(get_settings().assistant_per_ip_per_hour, 3600)


def get_limiter() -> RateLimiter:
    return _limiter()


LimiterDep = Annotated[RateLimiter, Depends(get_limiter)]


class SampleOut(BaseModel):
    id: str
    question: str


class AssistantInfo(BaseModel):
    ai_enabled: bool
    samples: list[SampleOut]


class Question(BaseModel):
    question: str = Field(min_length=3, max_length=600)
    sample: str | None = Field(default=None, max_length=40)


@router.get("", response_model=AssistantInfo)
def info(settings: SettingsDep) -> AssistantInfo:
    return AssistantInfo(
        ai_enabled=settings.ai_enabled,
        samples=[SampleOut(id=s.id, question=s.question) for s in assistant.load_samples().values()],
    )


@router.post("/ask")
def ask(
    body: Question,
    request: Request,
    session: SessionDep,
    factory: FactoryDep,
    settings: SettingsDep,
    limiter: LimiterDep,
) -> StreamingResponse:
    """Answers as Server-Sent Events: `data: {...}` lines, one per step, then the answer.

    Limits are checked before the stream starts, so they come back as ordinary HTTP errors.
    """
    if body.sample is not None and body.sample not in assistant.load_samples():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "There is no sample question with that id.")
    live = settings.ai_enabled and assistant.find_sample(body.question, body.sample) is None
    if live:
        since = datetime.now(UTC) - timedelta(days=1)
        today = session.scalar(
            select(func.count())
            .select_from(AssistantRun)
            .where(AssistantRun.mode == "ai", AssistantRun.created_at >= since)
        )
        if today >= settings.assistant_runs_per_day:
            raise HTTPException(
                status.HTTP_429_TOO_MANY_REQUESTS,
                "The assistant has answered as many questions today as CivicLens can afford. "
                "Please try again tomorrow, or try one of the sample questions.",
            )
        limiter.check(client_ip(request), "Too many questions from your network. Please wait a while.")

    def stream() -> Iterator[str]:
        # Its own session: the request's one may be closed before a long answer finishes.
        with factory() as own:
            for event in assistant.run(own, settings, body.question.strip(), body.sample):
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        # Tell proxies not to hold the stream back until it ends.
        headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"},
    )
