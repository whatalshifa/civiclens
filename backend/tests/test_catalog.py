import shutil
from pathlib import Path

import pytest
import yaml
from sqlalchemy import func, select

from app.models import LawSection, Pincode, Representative
from app.services.catalog import DATA_DIR, CatalogError, digest, load_catalog, read_catalog


def test_the_shipped_data_is_consistent():
    catalog = read_catalog()
    assert len(catalog.places.pincodes) >= 20
    assert {c.house for c in catalog.places.constituencies} == {"lok_sabha", "vidhan_sabha"}
    assert len(catalog.acts) >= 5


def test_every_representative_and_fact_has_a_dated_source(session):
    for rep in session.scalars(select(Representative)):
        assert rep.source.url.startswith("https://")
        assert rep.elected_on == rep.source.published_on
        for fact in rep.facts:
            assert fact.source.url.startswith("https://")


def test_seats_are_never_ordered_or_grouped_by_party():
    # Neutrality: the data file lists seats by house, then state and name; never by party.
    seats = read_catalog().places.constituencies
    for house in ("lok_sabha", "vidhan_sabha"):
        in_house = [s for s in seats if s.house == house]
        assert [s.id for s in in_house] == sorted(s.id for s in in_house)


@pytest.fixture
def data_copy(tmp_path: Path) -> Path:
    target = tmp_path / "data"
    shutil.copytree(DATA_DIR, target)
    return target


def edit(path: Path, change) -> None:
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    change(data)
    path.write_text(yaml.safe_dump(data, allow_unicode=True, sort_keys=False), encoding="utf-8")


@pytest.mark.parametrize(
    ("file", "change", "message"),
    [
        (
            "places.yaml",
            lambda d: d["constituencies"][0]["representative"].update(source="made-up"),
            "isn't in sources.yaml",
        ),
        ("places.yaml", lambda d: d["pincodes"][0].update(pin="012345"), "pin"),
        ("places.yaml", lambda d: d["pincodes"][0].update(seats=["ls-nowhere"]), "isn't listed"),
        ("places.yaml", lambda d: d["pincodes"][0].update(seats=[]), "isn't in any seat"),
        (
            "places.yaml",
            lambda d: d["pincodes"][0]["seats"].append("ls-varanasi"),
            "mark each one partial",
        ),
        ("places.yaml", lambda d: d["constituencies"].append(dict(d["constituencies"][0])), "share the id"),
        ("places.yaml", lambda d: d["constituencies"][0].update(house="vidhan_sabha"), "start with 'ac-'"),
        ("sources.yaml", lambda d: d[0].update(url="http://results.eci.gov.in/"), "url"),
        ("laws/02-rti-act.yaml", lambda d: d["sections"][0].update(summary="A «marked» word."), "« or »"),
        ("laws/02-rti-act.yaml", lambda d: d["sections"].append(dict(d["sections"][0])), "share the id"),
    ],
)
def test_inconsistent_data_is_refused_with_a_reason(data_copy, file, change, message):
    edit(data_copy / file, change)
    with pytest.raises(CatalogError, match=message):
        read_catalog(data_copy)


def test_a_pin_may_straddle_seats_when_marked_partial(data_copy):
    def straddle(d):
        d["pincodes"][0]["seats"] = [
            {"id": "ls-new-delhi", "partial": True},
            {"id": "ls-varanasi", "partial": True},
        ]

    edit(data_copy / "places.yaml", straddle)
    pin = read_catalog(data_copy).places.pincodes[0]
    assert [link.partial for link in pin.links()] == [True, True]


def test_loading_is_skipped_when_nothing_changed_and_redone_when_it_did(session, data_copy):
    load_catalog(session, data_copy, force=True)
    assert load_catalog(session, data_copy) is False

    before = digest(data_copy)
    edit(data_copy / "places.yaml", lambda d: d["pincodes"].pop())
    assert digest(data_copy) != before
    assert load_catalog(session, data_copy) is True
    assert session.scalar(select(func.count()).select_from(Pincode)) == len(
        read_catalog(data_copy).places.pincodes
    )

    # Put the shipped data back for the other tests.
    assert load_catalog(session) is True
    assert session.scalar(select(func.count()).select_from(LawSection)) > 50


def test_a_broken_file_leaves_the_loaded_data_untouched(session, data_copy):
    count = session.scalar(select(func.count()).select_from(Pincode))
    edit(data_copy / "places.yaml", lambda d: d["pincodes"][0].update(seats=["ls-nowhere"]))
    with pytest.raises(CatalogError):
        load_catalog(session, data_copy)
    session.rollback()
    assert session.scalar(select(func.count()).select_from(Pincode)) == count
