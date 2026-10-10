"""Each sitting MP's record in office: questions asked and attendance in the Lok Sabha, and their
local area development fund (MPLADS).

Writes app/data/generated/lok-sabha-record.csv, one row per seat with a sitting member, and the
sources it cites. The numbers are shown with the average for all MPs beside them, for context.
CivicLens never turns them into a score or a ranking.
"""

import csv
import io
import time
from dataclasses import asdict, dataclass, fields
from datetime import date
from pathlib import Path

import yaml

from pipeline import mplads, sansad
from pipeline.common import GENERATED_DIR, key, same_person, state_name
from pipeline.members import build_rows
from pipeline.sansad import Member

RECORD_FILE = GENERATED_DIR / "lok-sabha-record.csv"
SOURCES_FILE = GENERATED_DIR / "sources-lok-sabha-record.yaml"
QUESTIONS_SOURCE = "lok-sabha-questions"
ATTENDANCE_SOURCE = "lok-sabha-attendance"
FUND_SOURCE = "mplads-dashboard"


@dataclass
class RecordRow:
    seat: str  # the seat id, as in lok-sabha.csv
    member: str
    mpsno: int
    questions: int
    days_signed: int
    sitting_days: int
    fund_id: str  # the MPLADS dashboard's id for this MP; "" when it couldn't be matched
    fund_allocated: str  # rupees; "" without a fund match, as for the rest of the fund columns
    fund_spent: str
    works_recommended: str
    works_sanctioned: str
    works_completed: str


@dataclass
class Report:
    rows: int
    sessions: int
    no_attendance: list[str]
    no_fund: list[str]

    def markdown(self, fetched_on: date) -> str:
        lines = [
            f"## MPs' records, as fetched on {fetched_on:%-d %B %Y}",
            "",
            f"{self.rows} sitting MPs. Attendance covers {self.sessions} sessions of the 18th Lok Sabha.",
            "",
        ]
        if self.no_attendance:
            lines += [
                "### No attendance recorded",
                "",
                "Ministers and the Speaker don't sign the attendance register.",
                "",
                *[f"- {i}" for i in self.no_attendance],
                "",
            ]
        if self.no_fund:
            lines += [
                "### Not matched on the MPLADS dashboard",
                "",
                "These MPs' names didn't plainly match one on the dashboard for their state, so no fund "
                "figures are shown for them.",
                "",
                *[f"- {i}" for i in self.no_fund],
                "",
            ]
        return "\n".join(lines)


def sitting_seats(members: list[Member]) -> list[tuple[str, Member]]:
    """Each sitting member with the id of their seat, as lok-sabha.csv names it."""
    seat_ids = {(r.state, r.constituency): r.id for r in build_rows(members)}
    return [
        (seat_ids[(state_name(m.state), m.constituency)], m)
        for m in members
        if m.status.lower() == "sitting" and m.mpsno is not None
    ]


def match_fund(sitting: list[tuple[str, Member]], fund_mps: list[mplads.FundMp]) -> dict[str, mplads.FundMp]:
    """Pairs seats with dashboard MPs by name within each state. Only an unambiguous match counts."""
    matches = {}
    for seat, m in sitting:
        found = [
            f for f in fund_mps if key(f.state) == key(state_name(m.state)) and same_person(f.name, m.name)
        ]
        if len(found) == 1:
            matches[seat] = found[0]
    # A dashboard MP matched to two seats is ambiguous for both.
    taken: dict[int, int] = {}
    for f in matches.values():
        taken[f.id] = taken.get(f.id, 0) + 1
    return {seat: f for seat, f in matches.items() if taken[f.id] == 1}


def build(
    members: list[Member],
    questions: dict[int, int],
    attendance: dict[int, sansad.Attendance],
    sessions: int,
    fund_mps: list[mplads.FundMp],
    funds: dict[int, mplads.Fund],
) -> tuple[list[RecordRow], Report]:
    sitting = sitting_seats(members)
    matched = match_fund(sitting, fund_mps)

    rows, no_attendance, no_fund = [], [], []
    for seat, m in sorted(sitting):
        a = attendance.get(m.mpsno)
        if a is None or a.days_signed == 0:
            no_attendance.append(f"{m.name} ({m.constituency}, {m.state})")
        f = matched.get(seat)
        fund = funds.get(f.id) if f else None
        if fund is None:
            no_fund.append(f"{m.name} ({m.constituency}, {m.state})")
        rows.append(
            RecordRow(
                seat=seat,
                member=m.name,
                mpsno=m.mpsno,
                questions=questions.get(m.mpsno, 0),
                days_signed=a.days_signed if a else 0,
                sitting_days=a.sitting_days if a else 0,
                fund_id=str(f.id) if fund else "",
                fund_allocated=str(fund.allocated) if fund else "",
                fund_spent=str(fund.spent) if fund else "",
                works_recommended=str(fund.works_recommended) if fund else "",
                works_sanctioned=str(fund.works_sanctioned) if fund else "",
                works_completed=str(fund.works_completed) if fund else "",
            )
        )
    return rows, Report(len(rows), sessions, no_attendance, no_fund)


def fetch(members: list[Member], pause: float = 1.0):
    """Everything `build` needs, from sansad.in and the MPLADS dashboard. About 1,100 requests,
    spaced out to be gentle with both websites."""
    sitting = [m for m in members if m.status.lower() == "sitting" and m.mpsno is not None]
    questions = {}
    for m in sitting:
        questions[m.mpsno] = sansad.fetch_question_count(m.mpsno)
        time.sleep(pause)
    attendance, sessions = sansad.fetch_attendance(pause=pause)
    fund_mps = mplads.fetch_mps(pause=pause)
    wanted = match_fund(sitting_seats(members), fund_mps)
    funds = {}
    for f in wanted.values():
        try:
            funds[f.id] = mplads.fetch_fund(f.id)
        except (OSError, ValueError, KeyError):
            pass  # reported as unmatched; the rest of the run still counts
        time.sleep(pause)
    return questions, attendance, sessions, fund_mps, funds


def read_rows(path: Path = RECORD_FILE) -> list[RecordRow]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(line for line in f if not line.startswith("#"))
        numbers = ("mpsno", "questions", "days_signed", "sitting_days")
        return [RecordRow(**{**row, **{n: int(row[n]) for n in numbers}}) for row in reader]


def write(
    rows: list[RecordRow], fetched_on: date, sessions: int, generated_dir: Path = GENERATED_DIR
) -> None:
    generated_dir.mkdir(parents=True, exist_ok=True)
    out = io.StringIO()
    out.write(
        "# Generated by `python -m pipeline record` from sansad.in and the MPLADS dashboard. "
        "Don't edit by hand.\n"
    )
    writer = csv.DictWriter(out, fieldnames=[f.name for f in fields(RecordRow)], lineterminator="\n")
    writer.writeheader()
    writer.writerows(asdict(r) for r in rows)
    (generated_dir / RECORD_FILE.name).write_text(out.getvalue(), encoding="utf-8")

    sources = [
        {
            "id": QUESTIONS_SOURCE,
            "title": "Questions and answers, 18th Lok Sabha",
            "publisher": "Lok Sabha Secretariat",
            "url": "https://sansad.in/ls/questions/questions-and-answers",
            "published_on": fetched_on,
            "note": "Questions each member asked, alone or with other members, counted on this date.",
        },
        {
            "id": ATTENDANCE_SOURCE,
            "title": "Members' attendance, 18th Lok Sabha",
            "publisher": "Lok Sabha Secretariat",
            "url": "https://sansad.in/ls/members/attendance",
            "published_on": fetched_on,
            "note": f"Days each member signed the attendance register, over the {sessions} sessions held "
            "by this date. Ministers and the Speaker don't sign the register.",
        },
        {
            "id": FUND_SOURCE,
            "title": "MPLADS public dashboard (eSAKSHI)",
            "publisher": "Ministry of Statistics and Programme Implementation",
            "url": "https://mplads.mospi.gov.in/digigov/dashboard.html",
            "published_on": fetched_on,
            "note": "Each MP's fund figures for the 18th Lok Sabha, as the dashboard showed them then.",
        },
    ]
    header = "# Generated by the data pipeline. Sources for lok-sabha-record.csv.\n"
    (generated_dir / SOURCES_FILE.name).write_text(
        header + yaml.dump(sources, Dumper=_NoAliases, sort_keys=False, allow_unicode=True), encoding="utf-8"
    )


class _NoAliases(yaml.SafeDumper):
    """Writes the shared date out in full each time, instead of as a YAML alias (*id001)."""

    def ignore_aliases(self, data):
        return True
