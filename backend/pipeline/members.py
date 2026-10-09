"""Turns the Lok Sabha's member list into CivicLens's seats-and-MPs file, and says what changed.

Writes app/data/generated/lok-sabha.csv: one row per Lok Sabha seat, with its sitting member, or
none if the seat is vacant. Seats in the hand-checked file (places.yaml) are left out, because
hand-checked entries are never overwritten automatically; instead they are compared with the
official list, and any difference is reported for a person to look at.
"""

import csv
import io
from collections import defaultdict
from dataclasses import asdict, dataclass
from datetime import date
from pathlib import Path

import yaml

from pipeline.common import DATA_DIR, GENERATED_DIR, key, same_person, slug, state_name
from pipeline.sansad import Member

SEATS_FILE = GENERATED_DIR / "lok-sabha.csv"
SOURCES_FILE = GENERATED_DIR / "sources-lok-sabha.yaml"
SOURCE_ID = "lok-sabha-sitting-members"
COLUMNS = ["id", "state", "constituency", "reserved_for", "member", "party", "note"]


@dataclass
class SeatRow:
    id: str
    state: str
    constituency: str
    reserved_for: str  # "SC", "ST" or ""
    member: str  # "" when vacant
    party: str
    note: str  # why a seat is vacant: "Previous member died"


@dataclass
class Report:
    seats: int
    vacant: list[str]
    added: list[str]
    removed: list[str]
    changed: list[str]
    hand_checked: list[str]  # differences between places.yaml and the official list
    hand_checked_ok: int

    @property
    def has_changes(self) -> bool:
        return bool(self.added or self.removed or self.changed)

    def markdown(self, listed_on: date) -> str:
        lines = [
            f"## Lok Sabha members, as listed on sansad.in on {listed_on:%-d %B %Y}",
            "",
            f"{self.seats} seats, {self.seats - len(self.vacant)} with a sitting member.",
            "",
        ]
        for title, items in (
            ("New seats in the file", self.added),
            ("Seats no longer in the list", self.removed),
            ("Changes", self.changed),
            ("Vacant seats", self.vacant),
        ):
            if items:
                lines += [f"### {title}", "", *[f"- {i}" for i in items], ""]
        lines += ["### Hand-checked seats (places.yaml)", ""]
        if self.hand_checked:
            lines += [
                "These differ from the official list. Please check them against the source and update "
                "places.yaml by hand:",
                "",
                *[f"- {i}" for i in self.hand_checked],
                "",
            ]
        lines.append(f"{self.hand_checked_ok} hand-checked seats match the official list.")
        return "\n".join(lines) + "\n"


def build_rows(members: list[Member]) -> list[SeatRow]:
    """One row per seat. Sorted by state and name, never by party."""
    by_seat: dict[tuple[str, str], list[Member]] = defaultdict(list)
    for m in members:
        by_seat[(state_name(m.state), m.constituency)].append(m)

    # Some seat names exist in two states (Hamirpur, Aurangabad, Maharajganj): add the state.
    name_count = defaultdict(int)
    for _, name in by_seat:
        name_count[slug(name)] += 1

    rows = []
    for (state, name), people in sorted(by_seat.items()):
        sitting = [m for m in people if m.status.lower() == "sitting"]
        if len(sitting) > 1:
            raise ValueError(
                f"{name} ({state}) has {len(sitting)} sitting members: {[m.name for m in sitting]}"
            )
        seat_id = "ls-" + slug(name) + (f"-{slug(state)}" if name_count[slug(name)] > 1 else "")
        reserved = next((m.reserved_for for m in people if m.reserved_for), None) or ""
        if sitting:
            m = sitting[0]
            display = f"Dr. {m.name}" if m.title.rstrip(".").lower() == "dr" else m.name
            rows.append(SeatRow(seat_id, state, name, reserved, display, m.party, ""))
        else:
            last = people[-1].status.lower()
            note = {"died": "Previous member died", "resigned": "Previous member resigned"}.get(
                last, f"No sitting member ({people[-1].status})"
            )
            rows.append(SeatRow(seat_id, state, name, reserved, "", "", note))
    return rows


def hand_checked_seats(data_dir: Path = DATA_DIR) -> list[dict]:
    places = yaml.safe_load((data_dir / "places.yaml").read_text(encoding="utf-8"))
    return [c for c in places["constituencies"] if c["house"] == "lok_sabha"]


def compare(rows: list[SeatRow], old: list[SeatRow], hand: list[dict]) -> tuple[list[SeatRow], Report]:
    """Splits off the hand-checked seats, and lists what changed since the last run."""
    hand_keys = {(c["state"], key(c["name"])): c for c in hand}
    official = {(r.state, key(r.constituency)): r for r in rows}

    problems, ok = [], 0
    for (state, name_key), seat in sorted(hand_keys.items()):
        row = official.get((state, name_key))
        label = f"{seat['name']} ({state})"
        rep = seat.get("representative")
        listed = (rep or {}).get("listed_as") or {}
        if row is None:
            problems.append(f"{label}: not in the official list under this name")
        elif not row.member:
            problems.append(f"{label}: vacant in the official list ({row.note.lower()})")
        elif rep is None:
            problems.append(f"{label}: official list has {row.member} ({row.party})")
        elif not same_person(listed.get("name") or rep["name"], row.member):
            problems.append(f"{label}: we have {rep['name']}, official list has {row.member}")
        elif key(listed.get("party") or rep["party"]) != key(row.party):
            problems.append(f"{label}: party written as {rep['party']!r}, official list has {row.party!r}")
        else:
            ok += 1

    generated = [r for r in rows if (r.state, key(r.constituency)) not in hand_keys]

    before = {r.id: r for r in old}
    after = {r.id: r for r in generated}
    added = [f"{r.constituency} ({r.state})" for i, r in after.items() if i not in before]
    removed = [f"{r.constituency} ({r.state})" for i, r in before.items() if i not in after]
    changed = []
    for i in sorted(after.keys() & before.keys()):
        a, b = after[i], before[i]
        where = f"{a.constituency} ({a.state})"
        if a.member != b.member:
            changed.append(f"{where}: {b.member or 'vacant'} → {a.member or 'vacant'}")
        elif a.party != b.party:
            changed.append(f"{where}: {a.member}'s party {b.party} → {a.party}")
        elif a.reserved_for != b.reserved_for:
            changed.append(
                f"{where}: reserved for {b.reserved_for or 'nobody'} → {a.reserved_for or 'nobody'}"
            )

    report = Report(
        seats=len(rows),
        vacant=[f"{r.constituency} ({r.state}): {r.note.lower()}" for r in rows if not r.member],
        added=added if before else [f"{len(added)} seats (first run)"] if added else [],
        removed=removed,
        changed=changed,
        hand_checked=problems,
        hand_checked_ok=ok,
    )
    return generated, report


def read_rows(path: Path = SEATS_FILE) -> list[SeatRow]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8", newline="") as f:
        return [SeatRow(**row) for row in csv.DictReader(_without_comments(f))]


def write(rows: list[SeatRow], listed_on: date, generated_dir: Path = GENERATED_DIR) -> None:
    generated_dir.mkdir(parents=True, exist_ok=True)
    out = io.StringIO()
    out.write(
        "# Generated by `python -m pipeline members` from the Lok Sabha's member list. Don't edit by hand:\n"
        "# correct a seat by adding it to places.yaml, which always wins.\n"
    )
    writer = csv.DictWriter(out, fieldnames=COLUMNS, lineterminator="\n")
    writer.writeheader()
    writer.writerows(asdict(r) for r in rows)
    (generated_dir / SEATS_FILE.name).write_text(out.getvalue(), encoding="utf-8")

    sources = [
        {
            "id": SOURCE_ID,
            "title": "Members of the 18th Lok Sabha",
            "publisher": "Lok Sabha Secretariat",
            "url": "https://sansad.in/ls/members",
            "published_on": listed_on,
            "note": "The Lok Sabha's member directory, as CivicLens's weekly check found it on this date.",
        }
    ]
    header = "# Generated by the data pipeline. Sources for lok-sabha.csv.\n"
    (generated_dir / SOURCES_FILE.name).write_text(
        header + yaml.safe_dump(sources, sort_keys=False, allow_unicode=True), encoding="utf-8"
    )


def _without_comments(lines):
    return (line for line in lines if not line.startswith("#"))
