"""The data pipeline's Lok Sabha step, on small made-up member lists."""

from datetime import date

import pytest

from pipeline import members
from pipeline.common import same_person, state_name
from pipeline.sansad import Member


def member(
    constituency,
    name="A Person",
    party="Party A",
    state="Kerala",
    status="Sitting",
    title="Shri",
    reserved=None,
):
    return Member(state, constituency, reserved, title, name, party, status)


def test_only_public_fields_are_kept_from_the_api():
    raw = {
        "stateName": "Tamil Nadu ",
        "constName": "Dharmapuri",
        "categoryCode": "(SC) ",
        "initial": "Shri",
        "mpFirstLastName": "Mani  A",
        "partyFname": "Dravida Munnetra Kazhagam",
        "status": "Sitting",
        "mpsno": 5814,
        "personalPhone": "99999",
        "email": ["someone@example.com"],
        "permanentFaddr": "a home address",
    }
    m = Member.from_api(raw)
    assert m.public() == {
        "state": "Tamil Nadu",
        "constituency": "Dharmapuri",
        "reserved_for": "SC",
        "title": "Shri",
        "name": "Mani A",
        "party": "Dravida Munnetra Kazhagam",
        "status": "Sitting",
        "mpsno": 5814,
    }


def test_rows_cover_every_seat_with_its_sitting_member():
    rows = members.build_rows(
        [
            member("Wayanad", "Old Member", status="Resigned"),
            member("Wayanad", "New Member"),
            member("Shillong", "Someone", state="Meghalaya", status="Died", reserved="ST"),
            member("Alappuzha", "A Doctor", title="Dr."),
        ]
    )
    assert [(r.id, r.member, r.note) for r in rows] == [
        ("ls-alappuzha", "Dr. A Doctor", ""),
        ("ls-wayanad", "New Member", ""),
        ("ls-shillong", "", "Previous member died"),
    ]
    assert rows[2].reserved_for == "ST"


def test_a_seat_name_used_in_two_states_gets_the_state_in_its_id():
    rows = members.build_rows(
        [member("Hamirpur", state="Himachal Pradesh"), member("Hamirpur", state="Uttar Pradesh")]
    )
    assert [r.id for r in rows] == ["ls-hamirpur-himachal-pradesh", "ls-hamirpur-uttar-pradesh"]


def test_two_sitting_members_for_one_seat_stop_the_pipeline():
    with pytest.raises(ValueError, match="2 sitting members"):
        members.build_rows([member("Wayanad", "One"), member("Wayanad", "Two")])


def test_state_names_are_made_consistent():
    assert state_name("NCT of Delhi") == "Delhi"
    assert members.build_rows([member("New Delhi", state="NCT of Delhi")])[0].state == "Delhi"


@pytest.mark.parametrize(
    ("ours", "official", "same"),
    [
        ("Dr. C. N. Manjunath", "C N Manjunath", True),
        ("Ravi Kishan (Ravindra Shukla)", "Ravindra Shukla Alias Ravi Kishan", True),
        ("Raghunandan Rao Madhavaneni", "Madhavaneni Raghunandan Rao", True),
        ("Rajesh Ranjan (Pappu Yadav)", "Rajesh Ranjan", True),
        ("Kangana Ranaut", "Kangna Ranaut", False),
        ("Rahul Gandhi", "Priyanka Gandhi Vadra", False),
    ],
)
def test_same_person(ours, official, same):
    assert same_person(ours, official) is same


def hand_seat(name, rep_name, party="Party A", state="Kerala", **extra):
    return {
        "id": f"ls-{name.lower()}",
        "house": "lok_sabha",
        "name": name,
        "state": state,
        "representative": {"name": rep_name, "party": party, **extra},
    }


def test_hand_checked_seats_are_compared_not_overwritten():
    rows = members.build_rows(
        [
            member("Wayanad", "New Member"),
            member("Alappuzha", "Same Person"),
            member("Kollam", "Kangna Ranaut"),
        ]
    )
    hand = [
        hand_seat("Wayanad", "Old Member"),
        hand_seat("Alappuzha", "Dr. Same Person"),
        hand_seat("Kollam", "Kangana Ranaut", listed_as={"name": "Kangna Ranaut"}),
    ]
    generated, report = members.compare(rows, [], hand)
    assert generated == []  # all three are hand-checked
    assert report.hand_checked == ["Wayanad (Kerala): we have Old Member, official list has New Member"]
    assert report.hand_checked_ok == 2


def test_a_party_spelt_differently_is_reported():
    rows = members.build_rows([member("Wayanad", "Same", party="Party B")])
    _, report = members.compare(rows, [], [hand_seat("Wayanad", "Same", party="Party A")])
    assert report.hand_checked == [
        "Wayanad (Kerala): party written as 'Party A', official list has 'Party B'"
    ]


def test_changes_since_the_last_run_are_listed():
    old = members.build_rows(
        [member("Wayanad", "Old"), member("Kollam", "Same", party="P1"), member("Idukki", "Gone")]
    )
    new = members.build_rows(
        [member("Wayanad", "New"), member("Kollam", "Same", party="P2"), member("Alappuzha", "Fresh")]
    )
    _, report = members.compare(new, old, [])
    assert report.added == ["Alappuzha (Kerala)"]
    assert report.removed == ["Idukki (Kerala)"]
    assert report.changed == ["Kollam (Kerala): Same's party P1 → P2", "Wayanad (Kerala): Old → New"]
    assert report.has_changes

    _, same = members.compare(new, new, [])
    assert not same.has_changes


def test_the_file_round_trips(tmp_path):
    rows = members.build_rows(
        [member("Wayanad", "Someone"), member("Shillong", state="Meghalaya", status="Died")]
    )
    members.write(rows, date(2026, 10, 9), tmp_path)
    assert members.read_rows(tmp_path / "lok-sabha.csv") == rows
    assert "published_on: 2026-10-09" in (tmp_path / "sources-lok-sabha.yaml").read_text()


def test_the_report_reads_well():
    rows = members.build_rows(
        [member("Wayanad", "Someone"), member("Shillong", state="Meghalaya", status="Died")]
    )
    _, report = members.compare(rows, [], [])
    text = report.markdown(date(2026, 10, 9))
    assert "as listed on sansad.in on 9 October 2026" in text
    assert "2 seats, 1 with a sitting member." in text
    assert "- Shillong (Meghalaya): previous member died" in text


def test_the_shipped_file_matches_the_hand_checked_seats():
    # The generated file must never contain a seat that places.yaml also has.
    hand = {(s["state"], s["name"]) for s in members.hand_checked_seats()}
    generated = {(r.state, r.constituency) for r in members.read_rows()}
    assert generated and not (hand & generated)
