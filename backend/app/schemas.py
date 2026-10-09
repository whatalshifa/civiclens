"""The shapes of the API's answers. FastAPI checks every response against these."""

from datetime import date

from pydantic import BaseModel, ConfigDict


class Out(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class SourceOut(Out):
    id: str
    title: str
    publisher: str
    url: str
    published_on: date | None
    note: str | None


class FactOut(Out):
    label: str
    value: str
    as_of: date | None
    source: SourceOut


class RepresentativeOut(Out):
    id: str
    name: str
    party: str
    elected_in: str
    elected_on: date
    source: SourceOut
    facts: list[FactOut]


class SeatOut(Out):
    id: str
    house: str
    name: str
    state: str
    reserved_for: str | None
    partial: bool = False
    representative: RepresentativeOut | None


class PlaceOut(BaseModel):
    pin: str
    area: str
    district: str
    state: str
    source: SourceOut
    seats_source: SourceOut
    seats: list[SeatOut]
    # Houses for which this PIN has no seat in our data yet ("vidhan_sabha", say).
    missing: list[str]


class PlaceBrief(BaseModel):
    pin: str
    area: str
    district: str
    state: str


class SeatBrief(BaseModel):
    id: str
    house: str
    name: str
    state: str
    pins: list[str]


class PlaceSearchOut(BaseModel):
    places: list[PlaceBrief]
    seats: list[SeatBrief]


class CoverageOut(BaseModel):
    pincodes: int
    seats: int
    states: list[str]
    examples: list[PlaceBrief]
    ai_enabled: bool


class ActBrief(Out):
    id: str
    title: str
    short_name: str
    year: int
    citation: str
    unit: str
    summary: str
    section_count: int


class SectionOut(Out):
    number: str
    anchor: str
    title: str
    summary: str
    official_text: str | None


class ActOut(ActBrief):
    source: SourceOut
    sections: list[SectionOut]


class SearchHit(BaseModel):
    act_id: str
    act_short_name: str
    unit: str
    number: str
    anchor: str
    # Matches are wrapped in « and » so the website can highlight them.
    title: str
    snippet: str


class SearchOut(BaseModel):
    query: str
    total: int
    results: list[SearchHit]
