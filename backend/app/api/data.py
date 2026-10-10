"""Open data: everything CivicLens shows, as CSV files anyone can download and reuse.

Each dataset is built from the same tables the pages read, so a download always matches the site.
Every row names the official source it came from, and rows are ordered by place or by law, never
by party.
"""

import csv
import io
from collections.abc import Callable, Iterable
from dataclasses import dataclass
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session, aliased

from app.api.guard import require_proxy
from app.db import SessionDep
from app.models import (
    Act,
    Constituency,
    LawSection,
    MemberRecord,
    OldCode,
    OldSection,
    Pincode,
    PincodeConstituency,
    Representative,
    Source,
)

router = APIRouter(prefix="/api", tags=["data"], dependencies=[Depends(require_proxy)])


@dataclass(frozen=True)
class Dataset:
    id: str
    title: str
    description: str
    columns: list[str]
    rows: Callable[[Session], Iterable[list]]


def _representatives(session: Session) -> Iterable[list]:
    sources = {s.id: s for s in session.scalars(select(Source))}
    rows = session.execute(
        select(Constituency, Representative)
        .outerjoin(Representative, Representative.constituency_id == Constituency.id)
        .order_by(Constituency.house, Constituency.state, Constituency.name)
    ).all()
    for c, rep in rows:
        # A vacant seat cites the source that fixes the seat itself.
        source = sources[rep.source_id if rep else c.source_id]
        yield [
            c.id,
            "Lok Sabha" if c.house == "lok_sabha" else "Vidhan Sabha",
            c.state,
            c.name,
            c.reserved_for or "",
            rep.name if rep else "",
            rep.party if rep else "",
            rep.elected_in if rep else c.vacancy or "",
            _day(rep.elected_on or source.published_on) if rep else "",
            source.url,
        ]


def _records(session: Session) -> Iterable[list]:
    sources = {s.id: s.url for s in session.scalars(select(Source))}
    rows = session.execute(
        select(MemberRecord, Representative, Constituency)
        .join(Representative, Representative.id == MemberRecord.representative_id)
        .join(Constituency, Constituency.id == Representative.constituency_id)
        .order_by(Constituency.state, Constituency.name)
    ).all()
    for r, rep, c in rows:
        yield [
            c.id,
            c.state,
            c.name,
            rep.name,
            r.questions,
            _blank(r.days_signed),
            _blank(r.sitting_days),
            _blank(r.fund_allocated),
            _blank(r.fund_spent),
            _blank(r.works_recommended),
            _blank(r.works_sanctioned),
            _blank(r.works_completed),
            _day(r.as_of),
            sources[r.questions_source_id],
            sources[r.attendance_source_id],
            sources[r.fund_source_id],
        ]


def _sections(session: Session) -> Iterable[list]:
    rows = session.execute(
        select(LawSection, Act, Source)
        .join(Act, Act.id == LawSection.act_id)
        .join(Source, Source.id == Act.source_id)
        .order_by(Act.position, LawSection.position)
    ).all()
    for s, act, source in rows:
        yield [act.id, act.title, act.unit, s.number, s.title, s.summary, source.url]


def _old_to_new(session: Session) -> Iterable[list]:
    new_act = aliased(Act)
    rows = session.execute(
        select(OldSection, OldCode, new_act, Source)
        .join(OldCode, OldCode.code == OldSection.code)
        .join(new_act, new_act.id == OldCode.new_act_id)
        .join(Source, Source.id == OldCode.source_id)
        .order_by(OldCode.position, OldSection.position)
    ).all()
    for s, code, act, source in rows:
        yield [
            code.short_name,
            s.number,
            act.short_name,
            s.new_number or "",
            s.title,
            s.note or "",
            source.url,
        ]


def _pincodes(session: Session) -> Iterable[list]:
    links: dict[str, list[str]] = {}
    for link in session.scalars(select(PincodeConstituency).order_by(PincodeConstituency.constituency_id)):
        links.setdefault(link.pin, []).append(link.constituency_id + ("*" if link.partial else ""))
    rows = session.execute(
        select(Pincode, Source).join(Source, Source.id == Pincode.source_id).order_by(Pincode.pin)
    ).all()
    for p, source in rows:
        yield [p.pin, p.area, p.district, p.state, " ".join(links.get(p.pin, [])), source.url]


DATASETS = {
    d.id: d
    for d in (
        Dataset(
            "representatives",
            "Seats and representatives",
            "Every Lok Sabha seat and the Vidhan Sabha seats CivicLens has, with the member who holds "
            "each one now. A vacant seat says why in the elected_in column.",
            [
                "seat_id",
                "house",
                "state",
                "constituency",
                "reserved_for",
                "member",
                "party",
                "elected_in",
                "as_of",
                "source",
            ],
            _representatives,
        ),
        Dataset(
            "mp-records",
            "MPs' records",
            "Questions asked and days the attendance register was signed in the 18th Lok Sabha, and each "
            "MP's local area development fund (MPLADS) in rupees. Blank attendance means none is recorded "
            "(ministers and the Speaker don't sign the register); blank fund columns mean the MP wasn't "
            "matched on the MPLADS dashboard.",
            [
                "seat_id",
                "state",
                "constituency",
                "member",
                "questions",
                "days_signed",
                "sitting_days",
                "fund_allocated",
                "fund_spent",
                "works_recommended",
                "works_sanctioned",
                "works_completed",
                "as_of",
                "questions_source",
                "attendance_source",
                "fund_source",
            ],
            _records,
        ),
        Dataset(
            "law-sections",
            "Law library",
            "Each section in the library with CivicLens's plain-language summary. The summaries are ours, "
            "not the law: the source column links to the official text.",
            ["act_id", "act", "unit", "number", "title", "summary", "source"],
            _sections,
        ),
        Dataset(
            "old-to-new",
            "Old to new criminal law sections",
            "IPC, CrPC and Evidence Act sections and the BNS, BNSS and BSA sections that replaced them, "
            "from the official correspondence tables.",
            ["old_code", "old_section", "new_code", "new_section", "title", "note", "source"],
            _old_to_new,
        ),
        Dataset(
            "pin-codes",
            "PIN codes and their seats",
            "The PIN codes CivicLens can look up and the seats each is in. A seat id ending in * holds only "
            "part of that PIN code.",
            ["pin", "area", "district", "state", "seats", "source"],
            _pincodes,
        ),
    )
}


class DatasetOut(BaseModel):
    id: str
    title: str
    description: str
    columns: list[str]
    rows: int


@router.get("/data", response_model=list[DatasetOut])
def list_datasets(session: SessionDep) -> list[DatasetOut]:
    return [
        DatasetOut(
            id=d.id,
            title=d.title,
            description=d.description,
            columns=d.columns,
            rows=sum(1 for _ in d.rows(session)),
        )
        for d in DATASETS.values()
    ]


@router.get("/data/{dataset_id}.csv")
def download(dataset_id: str, session: SessionDep) -> Response:
    dataset = DATASETS.get(dataset_id)
    if dataset is None:
        raise HTTPException(404, "There's no dataset with that name.")
    out = io.StringIO()
    writer = csv.writer(out, lineterminator="\n")
    writer.writerow(dataset.columns)
    writer.writerows(dataset.rows(session))
    return Response(
        out.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"content-disposition": f'attachment; filename="civiclens-{dataset.id}.csv"'},
    )


def _day(value: date | None) -> str:
    return value.isoformat() if value else ""


def _blank(value: int | None) -> str | int:
    return "" if value is None else value
