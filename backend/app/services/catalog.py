"""Loads the data files in app/data into the database, after checking them.

The data files are the single source of truth: people (and later the data pipeline) edit the
YAML, and this module turns it into rows. Loading is all-or-nothing in one transaction, so
visitors never see half-loaded data, and it is skipped when the files haven't changed.
"""

import hashlib
import logging
import re
from datetime import date
from pathlib import Path
from typing import Literal

import yaml
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import delete, select, text
from sqlalchemy.orm import Session

from app.models import (
    Act,
    Constituency,
    DataVersion,
    LawSection,
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


class RepresentativeIn(Strict):
    name: str
    party: str
    elected_in: str
    source: str
    facts: list[FactIn] = []


class ConstituencyIn(Strict):
    id: str
    house: Literal["lok_sabha", "vidhan_sabha"]
    name: str
    state: str
    reserved_for: Literal["SC", "ST"] | None = None
    source: str
    representative: RepresentativeIn | None = None

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
    number: str = Field(pattern=r"^[0-9]+[A-Z]?(\([0-9a-z]+\))*$")
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


class Catalog(BaseModel):
    sources: list[SourceIn]
    places: PlacesFile
    acts: list[ActIn]


def _read_yaml(path: Path):
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f)


def _unique(ids: list[str], what: str) -> None:
    seen: set[str] = set()
    for i in ids:
        if i in seen:
            raise CatalogError(f"Two {what} share the id {i!r}")
        seen.add(i)


def read_catalog(data_dir: Path = DATA_DIR) -> Catalog:
    """Reads and checks every data file. Raises CatalogError naming the first problem found."""
    try:
        catalog = Catalog(
            sources=_read_yaml(data_dir / "sources.yaml"),
            places=_read_yaml(data_dir / "places.yaml"),
            acts=[_read_yaml(p) for p in sorted((data_dir / "laws").glob("*.yaml"))],
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

    return catalog


def digest(data_dir: Path = DATA_DIR) -> str:
    """A fingerprint of every data file, so unchanged data isn't reloaded."""
    h = hashlib.sha256()
    for path in sorted(data_dir.rglob("*.yaml")):
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
                elected_on=sources[rep.source].published_on,
                source_id=rep.source,
                facts=[
                    RepresentativeFact(
                        position=i, label=f.label, value=f.value, as_of=f.as_of, source_id=f.source
                    )
                    for i, f in enumerate(rep.facts)
                ],
            )
        )

    for p in catalog.places.pincodes:
        session.add(Pincode(pin=p.pin, area=p.area, district=p.district, state=p.state, source_id=p.source))
    session.flush()
    for p in catalog.places.pincodes:
        for link in p.links():
            session.add(
                PincodeConstituency(
                    pin=p.pin, constituency_id=link.id, partial=link.partial, source_id=p.seats_source
                )
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
