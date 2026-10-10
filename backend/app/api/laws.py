"""The law library: acts, their sections in plain language, and search."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.api.guard import require_proxy
from app.db import SessionDep
from app.models import Act, LawSection, OldCode, OldSection, Source
from app.schemas import (
    ActBrief,
    ActOut,
    OldCodeOut,
    OldLookupOut,
    OldSectionOut,
    SearchHit,
    SearchOut,
    SectionOut,
    SourceOut,
)
from app.services import old_to_new
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


def _old_section(row: OldSection, code: OldCode, anchors: dict) -> OldSectionOut:
    return OldSectionOut(
        code=code.code,
        code_short_name=code.short_name,
        number=row.number,
        new_act_id=code.new_act_id,
        new_act_short_name=code.new_act.short_name,
        new_number=row.new_number,
        title=row.title,
        note=row.note,
        anchor=old_to_new.section_anchor(anchors, code.new_act, row.new_number),
    )


@router.get("/laws/old-to-new", response_model=list[OldCodeOut])
def old_to_new_tables(session: SessionDep) -> list[OldCodeOut]:
    """Every old IPC, CrPC and Evidence Act section we have, beside its new number."""
    anchors = old_to_new.library_anchors(session)
    return [
        OldCodeOut(
            code=c.code,
            name=c.name,
            short_name=c.short_name,
            new_act_id=c.new_act_id,
            new_act_short_name=c.new_act.short_name,
            new_act_title=c.new_act.title,
            source=SourceOut.model_validate(c.source),
            sections=[_old_section(r, c, anchors) for r in c.sections],
        )
        for c in old_to_new.all_codes(session)
    ]


@router.get("/laws/old-to-new/lookup", response_model=OldLookupOut)
def old_to_new_lookup(
    session: SessionDep, q: Annotated[str, Query(min_length=1, max_length=200)]
) -> OldLookupOut:
    """'IPC 420' -> BNS 318(4). Also 'CrPC 154', '65B evidence', and backwards: 'BNS 318'."""
    matches = old_to_new.lookup(session, q)
    anchors = old_to_new.library_anchors(session) if matches else {}
    sources = {m.code.source.id: m.code.source for m in matches}
    return OldLookupOut(
        query=q,
        numbers=old_to_new.section_numbers(q),
        matches=[_old_section(m.row, m.code, anchors) for m in matches],
        sources=[SourceOut.model_validate(s) for s in sources.values()],
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
