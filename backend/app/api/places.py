"""Find your representatives: PIN code -> seats -> the people who hold them."""

import re
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

from app.api.guard import require_proxy
from app.config import Settings, get_settings
from app.db import SessionDep
from app.models import Constituency, Pincode, PincodeConstituency, Representative, Source
from app.schemas import (
    CoverageOut,
    PlaceBrief,
    PlaceOut,
    PlaceSearchOut,
    SeatBrief,
    SeatOut,
    SourceOut,
)
from app.services.catalog import PIN_PATTERN

router = APIRouter(prefix="/api", tags=["places"], dependencies=[Depends(require_proxy)])

HOUSES = ("lok_sabha", "vidhan_sabha")

# Pages the website links "Try one" buttons to. A spread of states, in the sample data.
EXAMPLE_PINS = ("221001", "413102", "110001", "695001", "500002", "148024")


def _brief(p: Pincode) -> PlaceBrief:
    return PlaceBrief(pin=p.pin, area=p.area, district=p.district, state=p.state)


@router.get("/places/{pin}", response_model=PlaceOut)
def get_place(pin: str, session: SessionDep) -> PlaceOut:
    pin = re.sub(r"\s", "", pin)
    if not PIN_PATTERN.match(pin):
        raise HTTPException(422, "A PIN code is six digits and doesn't start with 0, like 110001.")
    place = session.scalar(
        select(Pincode)
        .where(Pincode.pin == pin)
        .options(
            selectinload(Pincode.links)
            .selectinload(PincodeConstituency.constituency)
            .selectinload(Constituency.representative)
            .options(
                selectinload(Representative.source),
                selectinload(Representative.facts),
            )
        )
    )
    if place is None:
        raise HTTPException(404, f"We don't have PIN code {pin} yet.")

    links = sorted(
        place.links, key=lambda link: (HOUSES.index(link.constituency.house), link.constituency.name)
    )
    seats = [
        SeatOut.model_validate(link.constituency).model_copy(update={"partial": link.partial})
        for link in links
    ]
    seats_source_id = links[0].source_id
    sources = {
        s.id: s
        for s in session.scalars(select(Source).where(Source.id.in_([place.source_id, seats_source_id])))
    }
    return PlaceOut(
        **_brief(place).model_dump(),
        source=SourceOut.model_validate(sources[place.source_id]),
        seats_source=SourceOut.model_validate(sources[seats_source_id]),
        seats=seats,
        missing=[h for h in HOUSES if not any(s.house == h for s in seats)],
    )


@router.get("/places", response_model=PlaceSearchOut)
def search_places(
    session: SessionDep, q: Annotated[str, Query(min_length=2, max_length=60)]
) -> PlaceSearchOut:
    """Find places by area, district or seat name, for people who don't know their PIN."""
    term = f"%{q.strip()}%"
    places = session.scalars(
        select(Pincode)
        .where(or_(Pincode.area.ilike(term), Pincode.district.ilike(term), Pincode.pin.startswith(q.strip())))
        .order_by(Pincode.state, Pincode.area)
        .limit(10)
    ).all()
    seats = session.execute(
        select(Constituency, func.array_agg(PincodeConstituency.pin))
        .join(PincodeConstituency, PincodeConstituency.constituency_id == Constituency.id)
        .where(Constituency.name.ilike(term))
        .group_by(Constituency.id)
        .order_by(Constituency.state, Constituency.name)
        .limit(10)
    ).all()
    return PlaceSearchOut(
        places=[_brief(p) for p in places],
        seats=[
            SeatBrief(id=c.id, house=c.house, name=c.name, state=c.state, pins=sorted(pins))
            for c, pins in seats
        ],
    )


@router.get("/coverage", response_model=CoverageOut)
def coverage(session: SessionDep, settings: Annotated[Settings, Depends(get_settings)]) -> CoverageOut:
    """How much of India the data covers, and a few PIN codes to try."""
    examples = session.scalars(select(Pincode).where(Pincode.pin.in_(EXAMPLE_PINS))).all()
    by_pin = {p.pin: p for p in examples}
    return CoverageOut(
        pincodes=session.scalar(select(func.count()).select_from(Pincode)) or 0,
        seats=session.scalar(select(func.count()).select_from(Constituency)) or 0,
        states=list(session.scalars(select(Constituency.state).distinct().order_by(Constituency.state))),
        examples=[_brief(by_pin[pin]) for pin in EXAMPLE_PINS if pin in by_pin],
        ai_enabled=settings.ai_enabled,
    )
