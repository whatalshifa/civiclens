"""The data pipeline's PIN code step, on a made-up map of two square seats."""

import csv
import json

import pytest

from app.services.catalog import read_catalog
from pipeline import pins

# Two seats side by side in Kerala, and one in an Assam whose seats have since been redrawn.
SQUARES = {
    ("Kerala", "Wayanad", 1): (75.0, 11.0),
    ("Kerala", "Kozhikode", 2): (76.0, 11.0),
    ("Assam", "Kokrajhar", 3): (90.0, 26.0),
}


def square(lon, lat):
    return {
        "type": "Polygon",
        "coordinates": [[[lon, lat], [lon + 1, lat], [lon + 1, lat + 1], [lon, lat + 1], [lon, lat]]],
    }


@pytest.fixture
def boundaries(tmp_path):
    path = tmp_path / "pc.geojson"
    features = [
        {
            "type": "Feature",
            "properties": {
                "pc_id": i,
                "st_name": state.upper() if state == "Assam" else state,
                "pc_name": name,
            },
            "geometry": square(*corner),
        }
        for (state, name, i), corner in SQUARES.items()
    ]
    path.write_text(json.dumps({"type": "FeatureCollection", "features": features}))
    return path


SEAT_IDS = {
    ("Kerala", "wayanad"): "ls-wayanad",
    ("Kerala", "kozhikode"): "ls-kozhikode",
    ("Assam", "kokrajhar"): "ls-kokrajhar",
}


def directory(tmp_path, rows):
    path = tmp_path / "pincodes.csv"
    with path.open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(
            [
                "circlename",
                "regionname",
                "divisionname",
                "officename",
                "pincode",
                "officetype",
                "delivery",
                "district",
                "statename",
                "latitude",
                "longitude",
            ]
        )
        for pin, name, kind, state, lat, lon in rows:
            w.writerow(["Kerala Circle", "", "", name, pin, kind, "Delivery", "WAYANAD", state, lat, lon])
    return path


def test_pins_are_placed_in_the_seat_their_offices_are_in(tmp_path, boundaries):
    seats, unmatched = pins.load_seats(boundaries, SEAT_IDS)
    assert unmatched == []
    assert {s.id for s in seats} == {"ls-wayanad", "ls-kozhikode"}  # Assam's old seats are left out

    offices = pins.read_directory(
        directory(
            tmp_path,
            [
                ("673121", "Kalpetta B.O", "B.O", "KERALA", "11.5", "75.5"),
                ("673121", "Kalpetta H.O", "H.O", "KERALA", "11.6", "75.6"),
                ("673001", "Kozhikode S.O", "S.O", "KERALA", "11.5", "75.5"),  # spans both seats
                ("673001", "Calicut Beach B.O", "B.O", "KERALA", "11.5", "76.5"),
                ("673002", "Nowhere B.O", "B.O", "KERALA", "NA", ""),  # no coordinates
                ("673003", "Abroad B.O", "B.O", "KERALA", "51.5", "-0.1"),  # outside India
                ("783370", "Kokrajhar H.O", "H.O", "ASSAM", "26.5", "90.5"),  # stale boundaries
            ],
        )
    )
    result = pins.map_pins(offices, seats)
    assert result.rows == [
        {
            "pin": "673001",
            "area": "Kozhikode",
            "district": "Wayanad",
            "state": "Kerala",
            "lok_sabha": "ls-kozhikode* ls-wayanad*",
        },
        {
            "pin": "673121",
            "area": "Kalpetta",
            "district": "Wayanad",
            "state": "Kerala",
            "lok_sabha": "ls-wayanad",
        },
    ]
    assert result.unmapped_pins == 2
    assert result.stale_pins == 1
    assert result.skipped == {"no coordinates": 1, "coordinates outside India": 1}
    assert (
        "2 PIN codes mapped to Lok Sabha seats (1 span more than one seat), from 4 of 7 post offices."
        in result.markdown()
    )


def test_an_office_inside_another_states_seat_is_left_out(tmp_path, boundaries):
    seats, _ = pins.load_seats(boundaries, SEAT_IDS)
    offices = pins.read_directory(
        directory(tmp_path, [("600001", "Chennai G.P.O.", "H.O", "TAMIL NADU", "11.5", "75.5")])
    )
    result = pins.map_pins(offices, seats)
    assert result.rows == []
    assert result.skipped == {"in a constituency of another state": 1}


def test_unknown_boundary_names_are_reported(boundaries):
    _, unmatched = pins.load_seats(boundaries, {("Kerala", "wayanad"): "ls-wayanad"})
    assert unmatched == ["Kozhikode (Kerala)"]


def test_every_real_boundary_name_matches_a_seat():
    # The shipped seat list must cover the DataMeet file's names, through the alias maps.
    ids = pins.seat_ids()
    names = {(s, n) for (s, n) in ids}
    for alias in pins.SEAT_NAMES.values():
        assert any(n == pins.key(alias) for _, n in names), alias
    assert len(set(ids.values())) == 543


def test_the_catalog_reads_the_generated_file_and_hand_checked_pins_win(tmp_path, boundaries):
    import shutil

    from app.services.catalog import DATA_DIR

    data = tmp_path / "data"
    shutil.copytree(DATA_DIR, data)
    seats, _ = pins.load_seats(boundaries, SEAT_IDS)
    hand_pin = read_catalog(data).places.pincodes[0].pin
    result = pins.Result(
        rows=[
            {
                "pin": hand_pin,
                "area": "Somewhere else",
                "district": "X",
                "state": "Kerala",
                "lok_sabha": "ls-wayanad",
            },
            {
                "pin": "673122",
                "area": "Kalpetta",
                "district": "Wayanad",
                "state": "Kerala",
                "lok_sabha": "ls-wayanad",
            },
            {
                "pin": "673001",
                "area": "Kozhikode",
                "district": "Kozhikode",
                "state": "Kerala",
                "lok_sabha": "ls-kozhikode* ls-wayanad*",
            },
        ]
    )
    pins.write(result, data / "generated")
    catalog = read_catalog(data)
    by_pin = {p.pin: p for p in catalog.places.pincodes}
    assert by_pin[hand_pin].area != "Somewhere else"
    assert [(link.id, link.partial) for link in by_pin["673001"].links()] == [
        ("ls-kozhikode", True),
        ("ls-wayanad", True),
    ]
    assert by_pin["673122"].seats_source == "pin-seat-mapping"
    assert by_pin["673122"].source == "india-post-pincodes"
