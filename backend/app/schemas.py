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
    elected_on: date | None
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
    vacancy: str | None = None


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


class SeatListItem(BaseModel):
    id: str
    house: str
    name: str
    state: str
    reserved_for: str | None
    member: str | None  # None when the seat is vacant
    party: str | None


class StateSeatsOut(BaseModel):
    state: str
    seats: list[SeatListItem]


class SeatPageOut(BaseModel):
    seat: SeatOut
    source: SourceOut  # what fixes the seat's area
    pins: list[PlaceBrief]  # PIN codes in (or partly in) the seat, as far as CivicLens knows
    pins_sources: list[SourceOut]


class CoverageOut(BaseModel):
    pincodes: int
    seats: int
    lok_sabha_seats: int
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


class OldSectionOut(BaseModel):
    code: str  # "ipc"
    code_short_name: str  # "IPC"
    number: str  # "420"
    new_act_id: str
    new_act_short_name: str  # "BNS"
    new_number: str | None  # "318(4)"; None when the old section wasn't carried over
    title: str
    note: str | None
    # Where the new section is in the law library, when it's one of the sections we summarise.
    anchor: str | None


class OldCodeOut(BaseModel):
    code: str
    name: str
    short_name: str
    new_act_id: str
    new_act_short_name: str
    new_act_title: str
    source: SourceOut
    sections: list[OldSectionOut]


class OldLookupOut(BaseModel):
    query: str
    numbers: list[str]  # the section numbers read from the question
    matches: list[OldSectionOut]
    sources: list[SourceOut]
