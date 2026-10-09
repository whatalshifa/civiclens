"""The law library: acts, their sections in plain language, and search."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.guard import require_proxy
from app.db import SessionDep
from app.models import Act, LawSection, Source
from app.schemas import ActBrief, ActOut, SearchHit, SearchOut, SectionOut, SourceOut
from app.services.search import anchor, search_laws

router = APIRouter(prefix="/api", tags=["laws"], dependencies=[Depends(require_proxy)])


def _brief(act: Act, section_count: int) -> ActBrief:
    fields = {k: getattr(act, k) for k in ActBrief.model_fields if k != "section_count"}
    return ActBrief(**fields, section_count=section_count)


@router.get("/laws", response_model=list[ActBrief])
def list_acts(session: SessionDep) -> list[ActBrief]:
    rows = session.execute(
        select(Act, func.count(LawSection.id))
        .join(LawSection, LawSection.act_id == Act.id)
        .group_by(Act.id)
        .order_by(Act.position)
    ).all()
    return [_brief(act, n) for act, n in rows]


@router.get("/laws/search", response_model=SearchOut)
def search(
    session: SessionDep,
    q: Annotated[str, Query(min_length=1, max_length=200)],
    act: Annotated[str | None, Query(max_length=80)] = None,
) -> SearchOut:
    total, rows = search_laws(session, q, act)
    return SearchOut(
        query=q,
        total=total,
        results=[
            SearchHit(
                **{k: r[k] for k in SearchHit.model_fields if k != "anchor"}, anchor=anchor(r["number"])
            )
            for r in rows
        ],
    )


@router.get("/laws/{act_id}", response_model=ActOut)
def get_act(act_id: str, session: SessionDep) -> ActOut:
    act = session.scalar(select(Act).where(Act.id == act_id).options(selectinload(Act.sections)))
    if act is None:
        raise HTTPException(404, "We don't have that law.")
    return ActOut(
        **_brief(act, len(act.sections)).model_dump(),
        source=SourceOut.model_validate(act.source),
        sections=[
            SectionOut(
                number=s.number,
                anchor=anchor(s.number),
                title=s.title,
                summary=s.summary,
                official_text=s.official_text,
            )
            for s in act.sections
        ],
    )


@router.get("/sources", response_model=list[SourceOut])
def list_sources(session: SessionDep) -> list[SourceOut]:
    return [
        SourceOut.model_validate(s)
        for s in session.scalars(select(Source).order_by(Source.publisher, Source.title))
    ]
