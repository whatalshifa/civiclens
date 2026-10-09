"""Works out which Lok Sabha seat each PIN code is in, from where its post offices are.

Inputs:
- India Post's PIN code directory (data.gov.in, "All India Pincode Directory"): every post
  office with its PIN code, district, state and map coordinates.
- Lok Sabha constituency boundaries (DataMeet's india_pc_2019_simplified.geojson, CC0).

Each post office is placed on the map and we look up which constituency's boundary contains it
(a "point in polygon" test). A PIN code whose offices all fall in one seat is in that seat; one
whose offices fall in several is marked as partly in each, and the website tells people to check
their voter ID for those. Offices without coordinates, outside India, or in a constituency of a
different state than the directory says are left out and counted in the report.

PIN codes are delivery areas, not electoral ones, so this is a good approximation rather than an
official mapping. No official PIN-to-constituency list exists.
"""

import csv
import io
import json
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from pathlib import Path

import yaml
from shapely.geometry import Point, shape
from shapely.strtree import STRtree

from pipeline.common import DATA_DIR, GENERATED_DIR, key, state_name
from pipeline.members import hand_checked_seats, read_rows

PINS_FILE = GENERATED_DIR / "pincodes.csv"
SOURCES_FILE = GENERATED_DIR / "sources-pincodes.yaml"
COLUMNS = ["pin", "area", "district", "state", "lok_sabha"]

# States whose seats were redrawn after these boundaries were made (Assam in 2023, Jammu and
# Kashmir in 2022). Their PIN codes are left unmapped rather than mapped to old seats.
STALE_STATES = {"Assam", "Jammu and Kashmir", "Ladakh"}

# The boundary file spells some seats differently from the Lok Sabha's list.
SEAT_NAMES = {
    "Anakapalli": "Anakapalle",
    "Anantapuramu": "Anantapur",
    "Arambagh": "Arambag",
    "Barrackpore": "Barrackpur",
    "Belagavi": "Belgaum",
    "Bhuvanagiri": "Bhongir",
    "Chikballapur": "Chikkballapur",
    "Chikodi": "Chikkodi",
    "Davangere": "Davanagere",
    "Firozepur": "Firozpur",
    "Haasan": "Hassan",
    "Haridwar": "Hardwar",
    "Janjgir": "Janjgir-Champa",
    "Kanyakumari": "Kanniyakumari",
    "Mahabubnagar": "Mahbubnagar",
    "Mandsaur": "Mandsour",
    "Mavelikara": "Mavelikkara",
    "Mayiladuturai": "Mayiladuthurai",
    "Peddapalli": "Peddapalle",
    "Thiruvallur": "Tiruvallur",
    "Thoothukudi": "Thoothukkudi",
}
# The boundary file names both Mumbai South (31) and Mumbai South Central (30) "Mumbai South".
SEAT_NAMES_BY_ID = {2730: "Mumbai South Central"}

INDIA = (6.0, 37.6, 68.0, 97.5)  # latitude and longitude bounds


@dataclass
class Office:
    pin: str
    name: str
    kind: str  # "H.O" head office, "S.O" sub office, "B.O" branch office
    district: str
    state: str
    lat: float | None
    lon: float | None


@dataclass
class Result:
    rows: list[dict]
    offices: int = 0
    placed: int = 0
    skipped: Counter = field(default_factory=Counter)
    unmapped_pins: int = 0
    stale_pins: int = 0

    def markdown(self) -> str:
        partial = sum(1 for r in self.rows if "*" in r["lok_sabha"])
        lines = [
            "## PIN codes",
            "",
            f"{len(self.rows)} PIN codes mapped to Lok Sabha seats ({partial} span more than one seat), "
            f"from {self.placed} of {self.offices} post offices.",
            "",
        ]
        if self.stale_pins:
            lines.append(
                f"{self.stale_pins} PIN codes in states with redrawn seats were left out "
                f"({', '.join(sorted(STALE_STATES))})."
            )
        if self.unmapped_pins:
            lines.append(f"{self.unmapped_pins} PIN codes had no post office we could place on the map.")
        if self.skipped:
            lines += ["", "Post offices left out:", ""]
            lines += [f"- {reason}: {n}" for reason, n in self.skipped.most_common()]
        return "\n".join(lines) + "\n"


def read_directory(path: Path) -> list[Office]:
    """Reads India Post's directory. Column names vary a little between releases."""
    with path.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        columns = {
            (c or "").strip().lower().replace(" ", "").replace("_", ""): c for c in reader.fieldnames or []
        }

        def col(*names: str) -> str:
            for n in names:
                if n in columns:
                    return columns[n]
            raise ValueError(f"The directory has no {names[0]} column; it has {list(columns)}")

        c_pin, c_name = col("pincode", "pin"), col("officename", "office")
        c_kind, c_district = col("officetype", "type"), col("district", "districtname")
        c_state, c_lat, c_lon = (
            col("statename", "state"),
            col("latitude", "lat"),
            col("longitude", "long", "lon"),
        )
        return [
            Office(
                pin=(row[c_pin] or "").strip(),
                name=(row[c_name] or "").strip(),
                kind=(row[c_kind] or "").strip().upper(),
                district=(row[c_district] or "").strip(),
                state=_state(row[c_state]),
                lat=_number(row[c_lat]),
                lon=_number(row[c_lon]),
            )
            for row in reader
        ]


def _state(value: str | None) -> str:
    """India Post writes states in capitals ("ANDHRA PRADESH"); CivicLens doesn't."""
    name = " ".join((value or "").split())
    if name.isupper():
        name = name.title().replace(" And ", " and ").replace(" Of ", " of ")
    return state_name(name)


def _number(value: str | None) -> float | None:
    try:
        return float((value or "").strip())
    except ValueError:
        return None


@dataclass
class Seat:
    id: str
    state: str
    geometry: object


def load_seats(boundaries: Path, seat_ids: dict[tuple[str, str], str]) -> tuple[list[Seat], list[str]]:
    """Boundaries joined to CivicLens seat ids. Returns the seats and any names that didn't match."""
    features = json.loads(boundaries.read_text(encoding="utf-8"))["features"]
    seats, unmatched = [], []
    for f in features:
        p = f["properties"]
        state = _state(p["st_name"])
        if state in STALE_STATES:
            continue
        name = SEAT_NAMES_BY_ID.get(p.get("pc_id")) or SEAT_NAMES.get(p["pc_name"], p["pc_name"])
        seat_id = seat_ids.get((state, key(name)))
        if seat_id is None:
            unmatched.append(f"{p['pc_name']} ({state})")
            continue
        seats.append(Seat(seat_id, state, shape(f["geometry"])))
    return seats, unmatched


def seat_ids(data_dir: Path = DATA_DIR) -> dict[tuple[str, str], str]:
    """(state, name) -> seat id, for every Lok Sabha seat CivicLens knows."""
    ids = {(r.state, key(r.constituency)): r.id for r in read_rows(data_dir / "generated" / "lok-sabha.csv")}
    ids.update({(s["state"], key(s["name"])): s["id"] for s in hand_checked_seats(data_dir)})
    return ids


def map_pins(offices: list[Office], seats: list[Seat]) -> Result:
    tree = STRtree([s.geometry for s in seats])
    result = Result(rows=[], offices=len(offices))
    by_pin: dict[str, list[Office]] = defaultdict(list)
    for o in offices:
        by_pin[o.pin].append(o)

    for pin, group in sorted(by_pin.items()):
        if not (len(pin) == 6 and pin.isdigit() and pin[0] != "0"):
            result.skipped["not a valid PIN code"] += len(group)
            continue
        state = Counter(o.state for o in group).most_common(1)[0][0]
        if state in STALE_STATES:
            result.stale_pins += 1
            continue
        found: Counter = Counter()
        for o in group:
            if o.lat is None or o.lon is None or (o.lat == 0 and o.lon == 0):
                result.skipped["no coordinates"] += 1
                continue
            if not (INDIA[0] <= o.lat <= INDIA[1] and INDIA[2] <= o.lon <= INDIA[3]):
                result.skipped["coordinates outside India"] += 1
                continue
            point = Point(o.lon, o.lat)
            hits = [seats[i] for i in tree.query(point, predicate="within")]
            if not hits:
                result.skipped["not inside any constituency"] += 1
                continue
            seat = hits[0]
            if seat.state != o.state:
                result.skipped["in a constituency of another state"] += 1
                continue
            found[seat.id] += 1
            result.placed += 1
        if not found:
            result.unmapped_pins += 1
            continue
        ids = sorted(found)
        result.rows.append(
            {
                "pin": pin,
                "area": _area(group),
                "district": Counter(o.district for o in group).most_common(1)[0][0].title(),
                "state": state,
                "lok_sabha": " ".join(i + ("*" if len(ids) > 1 else "") for i in ids),
            }
        )
    return result


def _area(group: list[Office]) -> str:
    """The name people know a PIN code by: its head or sub post office, without the suffix."""
    rank = {"H.O": 0, "HO": 0, "S.O": 1, "SO": 1, "B.O": 2, "BO": 2}
    best = min(group, key=lambda o: (rank.get(o.kind, 3), o.name))
    name = best.name
    for suffix in (" H.O", " S.O", " B.O", " HO", " SO", " BO", " G.P.O.", " GPO"):
        if name.upper().endswith(suffix):
            name = name[: -len(suffix)]
    return name.strip().title()


def write(result: Result, generated_dir: Path = GENERATED_DIR) -> None:
    out = io.StringIO()
    out.write(
        "# Generated by `python -m pipeline pins` from India Post's directory and constituency boundaries.\n"
        "# Don't edit by hand: correct a PIN code by adding it to places.yaml, which always wins.\n"
    )
    writer = csv.DictWriter(out, fieldnames=COLUMNS, lineterminator="\n")
    writer.writeheader()
    writer.writerows(result.rows)
    generated_dir.mkdir(parents=True, exist_ok=True)
    (generated_dir / PINS_FILE.name).write_text(out.getvalue(), encoding="utf-8")
    sources = [
        {
            "id": "pin-seat-mapping",
            "title": "PIN codes placed in Lok Sabha constituencies by post office location",
            "publisher": "CivicLens, from India Post's directory and DataMeet's constituency boundaries",
            "url": "https://github.com/datameet/maps/tree/master/parliamentary-constituencies",
            "note": "An approximation: PIN codes are delivery areas and can cross constituency lines.",
        },
    ]
    # The directory itself is india-post-pincodes in sources.yaml.
    header = "# Generated by the data pipeline. Sources for pincodes.csv.\n"
    (generated_dir / SOURCES_FILE.name).write_text(
        header + yaml.safe_dump(sources, sort_keys=False, allow_unicode=True), encoding="utf-8"
    )


def run(args) -> int:
    seats, unmatched = load_seats(args.boundaries, seat_ids())
    if unmatched:
        print("Boundary names with no matching seat:", ", ".join(unmatched))
        return 1
    result = map_pins(read_directory(args.directory), seats)
    write(result)
    summary = result.markdown()
    if args.report:
        args.report.write_text(summary, encoding="utf-8")
    print(summary)
    return 0
