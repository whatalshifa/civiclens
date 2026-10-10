"""MPs' records (questions, attendance, MPLADS fund) as loaded from the data pipeline's file."""

import csv
import shutil
from pathlib import Path

import pytest
from sqlalchemy import func, select

from app.models import MemberRecord
from app.services.catalog import DATA_DIR, CatalogError, read_catalog

RECORD = "generated/lok-sabha-record.csv"


def test_most_mps_have_a_record_and_every_record_cites_dated_sources(session):
    records = session.scalars(select(MemberRecord)).all()
    assert len(records) > 500
    for r in records:
        for source in (r.questions_source, r.attendance_source, r.fund_source):
            assert source.url.startswith("https://")
            assert source.published_on == r.as_of


def test_averages_are_the_same_on_every_record_and_leave_out_ministers(session):
    averages = session.execute(
        select(
            func.count(func.distinct(MemberRecord.questions_average)),
            func.count(func.distinct(MemberRecord.attendance_average)),
            func.count(func.distinct(MemberRecord.fund_spent_average)),
        )
    ).one()
    assert averages == (1, 1, 1)

    signers = session.scalars(select(MemberRecord).where(MemberRecord.days_signed.is_not(None))).all()
    r = signers[0]
    expected = sum(s.questions for s in signers) / len(signers)
    assert r.questions_average == pytest.approx(expected, abs=0.05)
    expected = sum(100 * s.days_signed / s.sitting_days for s in signers) / len(signers)
    assert r.attendance_average == pytest.approx(expected, abs=0.05)


def test_ministers_have_no_attendance_rather_than_zero(session):
    unrecorded = session.scalars(select(MemberRecord).where(MemberRecord.days_signed.is_(None))).all()
    assert unrecorded  # the Council of Ministers sits in the Lok Sabha
    assert all(r.sitting_days is None for r in unrecorded)
    assert not session.scalar(
        select(func.count()).select_from(MemberRecord).where(MemberRecord.days_signed == 0)
    )


def test_the_seat_page_shows_the_record_with_its_sources(client):
    seat = next(r for r in _rows(DATA_DIR / RECORD) if r["fund_id"] and r["days_signed"] != "0")
    record = client.get(f"/api/seats/{seat['seat']}").json()["seat"]["representative"]["record"]
    assert record["questions"] == int(seat["questions"])
    assert record["days_signed"] == int(seat["days_signed"])
    assert record["fund_allocated"] == int(seat["fund_allocated"])
    assert record["questions_source"]["id"] == "lok-sabha-questions"
    assert record["fund_source"]["publisher"] == "Ministry of Statistics and Programme Implementation"


def test_an_mla_has_no_record(client):
    place = client.get("/api/places/413102").json()
    mla = next(s for s in place["seats"] if s["house"] == "vidhan_sabha")
    assert mla["representative"]["record"] is None


@pytest.fixture
def data_copy(tmp_path: Path) -> Path:
    target = tmp_path / "data"
    shutil.copytree(DATA_DIR, target)
    return target


def _rows(path: Path) -> list[dict]:
    with path.open(encoding="utf-8") as f:
        return list(csv.DictReader(line for line in f if not line.startswith("#")))


def _rewrite(path: Path, change) -> None:
    rows = _rows(path)
    change(rows)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]), lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


@pytest.mark.parametrize(
    ("change", "message"),
    [
        (lambda rows: rows[0].update(seat="ls-nowhere"), "isn't a Lok Sabha seat"),
        (lambda rows: rows[0].update(days_signed="999"), "more days than the House sat"),
        (lambda rows: rows[0].update(questions="-1"), "greater than or equal to 0"),
        (lambda rows: rows.append(dict(rows[0])), "share the id"),
        (lambda rows: rows[0].update(fund_id="1", fund_spent=""), "incomplete"),
    ],
)
def test_an_inconsistent_record_is_refused(data_copy, change, message):
    _rewrite(data_copy / RECORD, change)
    with pytest.raises(CatalogError, match=message):
        read_catalog(data_copy)
