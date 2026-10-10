"""The data pipeline's record step: questions, attendance and MPLADS figures for each MP."""

from datetime import date

from pipeline import mplads, record, sansad
from pipeline.sansad import Attendance, Member


def mp(constituency, name, mpsno, state="Kerala", status="Sitting"):
    return Member(state, constituency, None, "Shri", name, "Party A", status, mpsno)


def fund_mp(id, name, state="Kerala"):
    return mplads.FundMp(id, name, state)


FUND = mplads.Fund(
    allocated=14_70_00_000, spent=1_55_21_947, works_recommended=28, works_sanctioned=13, works_completed=0
)


def test_tiles_are_read_from_the_dashboards_text():
    tiles = {
        "Allocated Limit for Hon'ble MPs": ["₹14,70,00,000.00", "₹14.70 Crore"],
        "Expenditure on Completed and On-going Works as on Date": ["₹1,55,21,947.00", "₹1.55 Crore"],
        "Works Recommended": ["28", "₹7,71,15,803.00", "₹7.71 Crore"],
        "Works Completed": ["0", "₹0.00", "₹0.00 Crore"],
        "Works Sanctioned": ["13", "₹3,62,32,528.00", "₹3.62 Crore"],
        "Current Tenure": [{"ID": 7, "CAPTION": "18th Lok Sabha"}],
    }
    assert mplads.parse_tiles(tiles) == FUND


def test_fund_mps_are_matched_by_name_within_their_state():
    members = [
        mp("Wayanad", "Priya Sharma", 1),
        mp("Kollam", "N K Premachandran", 2),
        mp("Thane", "Ravi Rao", 3, "Maharashtra"),
    ]
    fund_mps = [
        fund_mp(10, "PRIYA SHARMA"),
        fund_mp(11, "N.K. PREMACHANDRAN"),
        fund_mp(12, "Ravi Rao", "Kerala"),  # same name, other state: not a match
    ]
    matched = record.match_fund(record.sitting_seats(members), fund_mps)
    assert {seat: f.id for seat, f in matched.items()} == {"ls-wayanad": 10, "ls-kollam": 11}


def test_an_ambiguous_name_is_left_unmatched():
    members = [mp("Wayanad", "Anil Kumar", 1)]
    matched = record.match_fund(
        record.sitting_seats(members), [fund_mp(10, "Anil Kumar"), fund_mp(11, "ANIL KUMAR")]
    )
    assert matched == {}


def test_rows_report_what_is_missing():
    members = [
        mp("Wayanad", "Priya Sharma", 1),
        mp("Kollam", "A Minister", 2),
        mp("Idukki", "Former Member", 3, status="Resigned"),
    ]
    rows, report = record.build(
        members,
        questions={1: 128, 2: 0},
        attendance={1: Attendance(84, 156), 2: Attendance(0, 156)},
        sessions=8,
        fund_mps=[fund_mp(10, "Priya Sharma")],
        funds={10: FUND},
    )
    assert [(r.seat, r.questions, r.days_signed, r.fund_id, r.fund_allocated) for r in rows] == [
        ("ls-kollam", 0, 0, "", ""),
        ("ls-wayanad", 128, 84, "10", "147000000"),
    ]
    assert report.no_attendance == ["A Minister (Kollam, Kerala)"]
    assert report.no_fund == ["A Minister (Kollam, Kerala)"]
    text = report.markdown(date(2026, 10, 10))
    assert "2 sitting MPs. Attendance covers 8 sessions" in text
    assert "Ministers and the Speaker don't sign the attendance register." in text


def test_the_file_round_trips(tmp_path):
    rows, _ = record.build(
        [mp("Wayanad", "Priya Sharma", 1)],
        {1: 5},
        {1: Attendance(3, 4)},
        1,
        [fund_mp(10, "Priya Sharma")],
        {10: FUND},
    )
    record.write(rows, date(2026, 10, 10), 1, tmp_path)
    assert record.read_rows(tmp_path / "lok-sabha-record.csv") == rows
    sources = (tmp_path / "sources-lok-sabha-record.yaml").read_text()
    assert sources.count("published_on: 2026-10-10") == 3


def test_names_split_differently_still_match():
    members = [mp("Lucknow", "Rajnath Singh", 1, "Uttar Pradesh")]
    matched = record.match_fund(
        record.sitting_seats(members), [fund_mp(10, "RAJ NATH SINGH", "Uttar Pradesh")]
    )
    assert matched["ls-lucknow"].id == 10


def test_a_member_listed_twice_in_a_session_is_counted_once(monkeypatch):
    pages = {
        "session-dates?loksabha=18&session=1": ["01/07/2024", "02/07/2024"],
        "session-dates?loksabha=18&session=2": [],
        "MemberWise?loksabha=18&session=1": [
            {"mpsno": 7, "signedDaysCount": 1},
            {"mpsno": 7, "signedDaysCount": 2},
            {"mpsno": 8, "signedDaysCount": 0},
        ],
    }
    monkeypatch.setattr(sansad, "_get", lambda url: next(v for k, v in pages.items() if k in url))
    attendance, sessions = sansad.fetch_attendance(pause=0)
    assert sessions == 1
    assert attendance == {7: Attendance(2, 2), 8: Attendance(0, 2)}
