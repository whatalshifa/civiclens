"""Loads the data files in app/data into the database, after checking them.

The data files are the single source of truth. People edit the YAML; the data pipeline writes
the files in app/data/generated (see backend/pipeline). This module checks both and turns them
into rows. Where a hand-checked file and a generated one describe the same seat or PIN code,
the hand-checked one wins. Loading is all-or-nothing in one transaction, so
visitors never see half-loaded data, and it is skipped when the files haven't changed.
"""

import csv
import hashlib
import logging
import re
from datetime import date
from pathlib import Path
from typing import Literal

import yaml
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import delete, insert, select, text
from sqlalchemy.orm import Session

from app.models import (
    Act,
    Constituency,
    DataVersion,
    LawSection,
    OldCode,
    OldSection,
    Pincode,
    PincodeConstituency,
    Representative,
    RepresentativeFact,
    Source,
)

log = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

# Search snippets mark matches with these, so data must never contain them.
HIGHLIGHT_MARKS = ("«", "»")

PIN_PATTERN = re.compile(r"^[1-9][0-9]{5}$")  # Indian PIN codes are six digits and never start with 0
ID_PATTERN = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
SECTION_NUMBER = r"^[0-9]+[A-Z]?(\([0-9a-z]+\))*$"  # "6", "21A", "2(f)", "154(3)"


class CatalogError(ValueError):
    """The data files are inconsistent. The message says where."""


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class SourceIn(Strict):
    id: str
    title: str
    publisher: str
    url: str = Field(pattern=r"^https://")
    published_on: date | None = None
    note: str | None = None


class FactIn(Strict):
    label: str
    value: str
    source: str
    as_of: date | None = None


class ListedAs(Strict):
    """How an official list spells a name or party that we write differently on purpose."""

    name: str | None = None
    party: str | None = None


class RepresentativeIn(Strict):
    name: str
    party: str
    elected_in: str
    source: str
    # True when the source is an election result, whose date is the day it was declared. False
    # for a member list, which says who sits now but not when they were elected.
    result_declared: bool = True
    facts: list[FactIn] = []
    # Spellings the data pipeline's official list uses, acknowledged as the same person and party.
    listed_as: ListedAs | None = None


class ConstituencyIn(Strict):
    id: str
    house: Literal["lok_sabha", "vidhan_sabha"]
    name: str
    state: str
    reserved_for: Literal["SC", "ST"] | None = None
    source: str
    representative: RepresentativeIn | None = None
    vacancy: str | None = None  # why there's no representative, from the official list

    @model_validator(mode="after")
    def _prefix_matches_house(self):
        prefix = "ls-" if self.house == "lok_sabha" else "ac-"
        if not self.id.startswith(prefix):
            raise ValueError(f"{self.house} seat ids start with {prefix!r}: {self.id}")
        return self


class SeatLink(Strict):
    id: str
    partial: bool = False


class PincodeIn(Strict):
    pin: str = Field(pattern=PIN_PATTERN.pattern)
    area: str
    district: str
    state: str
    seats: list[str | SeatLink]
    source: str = "india-post-pincodes"
    seats_source: str = "delimitation-2008"

    def links(self) -> list[SeatLink]:
        return [SeatLink(id=s) if isinstance(s, str) else s for s in self.seats]


class PlacesFile(Strict):
    constituencies: list[ConstituencyIn]
    pincodes: list[PincodeIn]


class SectionIn(Strict):
    number: str = Field(pattern=SECTION_NUMBER)
    title: str
    summary: str
    keywords: str = ""
    official_text: str | None = None


class ActIn(Strict):
    id: str
    title: str
    short_name: str
    year: int
    citation: str
    unit: Literal["Article", "Section"]
    source: str
    summary: str
    # Words that should find every section of this act ("rti", "consumer court").
    keywords: str = ""
    sections: list[SectionIn]


class OldCodeIn(Strict):
    """A code the new criminal laws replaced, with its correspondence table (old-to-new.yaml)."""

    code: str = Field(pattern=r"^[a-z]+$")
    name: str
    short_name: str
    aliases: list[str]
    new_act: str
    source: str
    # [old number, new number, heading of the new section]
    rows: list[tuple[str, str, str]]
    # Old sections that were not carried over, and why.
    notes: dict[str, str] = {}

    @model_validator(mode="after")
    def _numbers(self):
        for old, new, _ in self.rows:
            for n in (old, new):
                if not re.match(SECTION_NUMBER, n):
                    raise ValueError(f"{self.code}: {n!r} isn't a section number like 420, 498A or 154(3)")
        for old in self.notes:
            if not re.match(SECTION_NUMBER, old):
                raise ValueError(f"{self.code}: note for {old!r}, which isn't a section number")
        return self


class Catalog(BaseModel):
    sources: list[SourceIn]
    places: PlacesFile
    acts: list[ActIn]
    old_codes: list[OldCodeIn] = []


def _read_yaml(path: Path):
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f)


GENERATED_SEAT_SOURCE = "lok-sabha-sitting-members"
GENERATED_PIN_SOURCE = "india-post-pincodes"
GENERATED_PIN_SEATS_SOURCE = "pin-seat-mapping"


def _csv_rows(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(line for line in f if not line.startswith("#")))


def _generated_seats(path: Path) -> list[ConstituencyIn]:
    """Lok Sabha seats from the data pipeline's file (generated/lok-sabha.csv)."""
    return [
        ConstituencyIn(
            id=row["id"],
            house="lok_sabha",
            name=row["constituency"],
            state=row["state"],
            reserved_for=row["reserved_for"] or None,
            source="delimitation-2008",
            representative=RepresentativeIn(
                name=row["member"],
                party=row["party"],
                elected_in="Sitting member of the 18th Lok Sabha",
                source=GENERATED_SEAT_SOURCE,
                result_declared=False,
            )
            if row["member"]
            else None,
            vacancy=row["note"] or None,
        )
        for row in _csv_rows(path)
    ]


def _generated_pincodes(path: Path) -> list[dict]:
    """PIN codes from the data pipeline's file (generated/pincodes.csv). A seat id ending in *
    holds only part of the PIN code."""
    return [
        {
            "pin": row["pin"],
            "area": row["area"],
            "district": row["district"],
            "state": row["state"],
            "seats": [
                {"id": seat.rstrip("*"), "partial": seat.endswith("*")} for seat in row["lok_sabha"].split()
            ],
            "source": GENERATED_PIN_SOURCE,
            "seats_source": GENERATED_PIN_SEATS_SOURCE,
        }
        for row in _csv_rows(path)
    ]


def _merge_generated(raw_places: dict, data_dir: Path) -> dict:
    """Adds the generated seats and PIN codes to the hand-checked ones. A hand-checked seat with
    the same state and name (or id), or a hand-checked PIN code, replaces its generated row."""
    hand = raw_places.get("constituencies") or []
    taken = {c["id"] for c in hand} | {
        (c["state"], _name_key(c["name"])) for c in hand if c["house"] == "lok_sabha"
    }
    extra = [
        c.model_dump(exclude_none=True)
        for c in _generated_seats(data_dir / "generated" / "lok-sabha.csv")
        if c.id not in taken and (c.state, _name_key(c.name)) not in taken
    ]
    hand_pins = raw_places.get("pincodes") or []
    pins_taken = {str(p["pin"]) for p in hand_pins}
    extra_pins = [
        p for p in _generated_pincodes(data_dir / "generated" / "pincodes.csv") if p["pin"] not in pins_taken
    ]
    return {**raw_places, "constituencies": hand + extra, "pincodes": hand_pins + extra_pins}


def _name_key(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", name.lower())


def _unique(ids: list[str], what: str) -> None:
    seen: set[str] = set()
    for i in ids:
        if i in seen:
            raise CatalogError(f"Two {what} share the id {i!r}")
        seen.add(i)


def read_catalog(data_dir: Path = DATA_DIR) -> Catalog:
    """Reads and checks every data file. Raises CatalogError naming the first problem found."""
    try:
        generated_sources = sorted((data_dir / "generated").glob("sources*.yaml"))
        old_to_new = data_dir / "old-to-new.yaml"
        catalog = Catalog(
            sources=_read_yaml(data_dir / "sources.yaml")
            + [s for p in generated_sources for s in _read_yaml(p)],
            places=_merge_generated(_read_yaml(data_dir / "places.yaml"), data_dir),
            acts=[_read_yaml(p) for p in sorted((data_dir / "laws").glob("*.yaml"))],
            old_codes=_read_yaml(old_to_new) if old_to_new.exists() else [],
        )
    except (OSError, yaml.YAMLError, ValueError) as exc:
        raise CatalogError(str(exc)) from exc

    sources = {s.id: s for s in catalog.sources}
    _unique([s.id for s in catalog.sources], "sources")

    def need_source(source_id: str, where: str) -> SourceIn:
        if source_id not in sources:
            raise CatalogError(f"{where} names source {source_id!r}, which isn't in sources.yaml")
        return sources[source_id]

    seats = {c.id: c for c in catalog.places.constituencies}
    _unique([c.id for c in catalog.places.constituencies], "seats")
    for c in catalog.places.constituencies:
        if not ID_PATTERN.match(c.id):
            raise CatalogError(f"Seat id {c.id!r} should be lowercase words joined by dashes")
        need_source(c.source, f"Seat {c.id}")
        if rep := c.representative:
            if need_source(rep.source, f"The representative for {c.id}").published_on is None:
                raise CatalogError(f"The source for {c.id}'s representative needs a published_on date")
            for fact in rep.facts:
                need_source(fact.source, f"A fact about {rep.name}")

    _unique([p.pin for p in catalog.places.pincodes], "PIN codes")
    for p in catalog.places.pincodes:
        need_source(p.source, f"PIN {p.pin}")
        need_source(p.seats_source, f"PIN {p.pin}")
        links = p.links()
        if not links:
            raise CatalogError(f"PIN {p.pin} isn't in any seat")
        for link in links:
            if link.id not in seats:
                raise CatalogError(f"PIN {p.pin} names seat {link.id!r}, which isn't listed")
        for house in ("lok_sabha", "vidhan_sabha"):
            in_house = [link for link in links if seats[link.id].house == house]
            if len(in_house) > 1 and not all(link.partial for link in in_house):
                raise CatalogError(f"PIN {p.pin} is in several {house} seats; mark each one partial")

    _unique([a.id for a in catalog.acts], "acts")
    for act in catalog.acts:
        need_source(act.source, f"Act {act.id}")
        _unique([s.number for s in act.sections], f"sections of {act.id}")
        for s in act.sections:
            for field in (s.title, s.summary, s.keywords, s.official_text or ""):
                if any(mark in field for mark in HIGHLIGHT_MARKS):
                    raise CatalogError(f"{act.id} section {s.number} uses « or », which search reserves")

    acts = {a.id for a in catalog.acts}
    _unique([c.code for c in catalog.old_codes], "old codes")
    for c in catalog.old_codes:
        need_source(c.source, f"The {c.short_name} correspondence table")
        if c.new_act not in acts:
            raise CatalogError(f"{c.short_name} is replaced by {c.new_act!r}, which isn't in the law library")
        olds = [old for old, _, _ in c.rows] + list(c.notes)
        _unique(olds, f"{c.short_name} sections")

    return catalog


def digest(data_dir: Path = DATA_DIR) -> str:
    """A fingerprint of every data file, so unchanged data isn't reloaded."""
    h = hashlib.sha256()
    for path in sorted([*data_dir.rglob("*.yaml"), *data_dir.rglob("*.csv")]):
        h.update(path.relative_to(data_dir).as_posix().encode())
        h.update(path.read_bytes())
    return h.hexdigest()


def load_catalog(session: Session, data_dir: Path = DATA_DIR, *, force: bool = False) -> bool:
    """Replaces the database's data with the files' data, if they changed. Returns True if it loaded."""
    # Only one API process loads at a time; others wait here, then see the new digest and skip.
    session.execute(text("SELECT pg_advisory_xact_lock(hashtext('civiclens-catalog'))"))
    fingerprint = digest(data_dir)
    current = session.get(DataVersion, "catalog")
    if current and current.digest == fingerprint and not force:
        session.commit()  # releases the lock
        return False

    catalog = read_catalog(data_dir)
    sources = {s.id: s for s in catalog.sources}

    for table in (
        OldSection,
        OldCode,
        LawSection,
        Act,
        RepresentativeFact,
        Representative,
        PincodeConstituency,
        Pincode,
        Constituency,
        Source,
    ):
        session.execute(delete(table))

    session.add_all(Source(**s.model_dump()) for s in catalog.sources)
    session.flush()

    for c in catalog.places.constituencies:
        session.add(
            Constituency(
                id=c.id,
                house=c.house,
                name=c.name,
                state=c.state,
                reserved_for=c.reserved_for,
                source_id=c.source,
                vacancy=c.vacancy,
            )
        )
    session.flush()
    for c in catalog.places.constituencies:
        if not (rep := c.representative):
            continue
        rep_id = c.id.replace("ls-", "mp-", 1).replace("ac-", "mla-", 1)
        session.add(
            Representative(
                id=rep_id,
                constituency_id=c.id,
                name=rep.name,
                party=rep.party,
                elected_in=rep.elected_in,
                elected_on=sources[rep.source].published_on if rep.result_declared else None,
                source_id=rep.source,
                facts=[
                    RepresentativeFact(
                        position=i, label=f.label, value=f.value, as_of=f.as_of, source_id=f.source
                    )
                    for i, f in enumerate(rep.facts)
                ],
            )
        )

    # Bulk inserts: the generated file has about 19,000 PIN codes.
    pins = catalog.places.pincodes
    if pins:
        session.execute(
            insert(Pincode),
            [
                dict(pin=p.pin, area=p.area, district=p.district, state=p.state, source_id=p.source)
                for p in pins
            ],
        )
        session.execute(
            insert(PincodeConstituency),
            [
                dict(pin=p.pin, constituency_id=link.id, partial=link.partial, source_id=p.seats_source)
                for p in pins
                for link in p.links()
            ],
        )

    for position, a in enumerate(catalog.acts):
        session.add(
            Act(
                id=a.id,
                title=a.title,
                short_name=a.short_name,
                year=a.year,
                citation=a.citation,
                unit=a.unit,
                summary=a.summary,
                position=position,
                source_id=a.source,
                sections=[
                    LawSection(
                        number=s.number,
                        position=i,
                        title=s.title,
                        summary=s.summary,
                        keywords=f"{s.keywords} {a.keywords}".strip(),
                        official_text=s.official_text,
                    )
                    for i, s in enumerate(a.sections)
                ],
            )
        )

    session.flush()
    for position, c in enumerate(catalog.old_codes):
        session.add(
            OldCode(
                code=c.code,
                name=c.name,
                short_name=c.short_name,
                aliases="|".join(a.lower() for a in c.aliases),
                new_act_id=c.new_act,
                source_id=c.source,
                position=position,
                sections=[
                    OldSection(number=old, new_number=new, title=title, position=i)
                    for i, (old, new, title) in enumerate(c.rows)
                ]
                + [
                    OldSection(number=old, title="Not carried over", note=note, position=len(c.rows) + i)
                    for i, (old, note) in enumerate(c.notes.items())
                ],
            )
        )

    if current:
        current.digest = fingerprint
        current.loaded_at = session.scalar(select(text("now()")))
    else:
        session.add(DataVersion(name="catalog", digest=fingerprint))
    session.commit()
    log.info(
        "Loaded data: %d sources, %d seats, %d PIN codes, %d acts",
        len(catalog.sources),
        len(catalog.places.constituencies),
        len(catalog.places.pincodes),
        len(catalog.acts),
    )
    return True
