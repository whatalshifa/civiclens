import pytest

from app.services.old_to_new import base, section_numbers


@pytest.mark.parametrize(
    ("question", "numbers"),
    [
        ("IPC 420", ["420"]),
        ("section 498 a of the ipc", ["498A"]),
        ("65-B evidence act", ["65B"]),
        ("crpc 154 (3) and 156(3)", ["154(3)", "156(3)"]),
        ("420 of IPC", ["420"]),
        ("no numbers here", []),
    ],
)
def test_section_numbers_are_read_from_a_question(question, numbers):
    assert section_numbers(question) == numbers


def test_base_drops_the_sub_section():
    assert base("318(4)") == "318"
    assert base("498A") == "498A"


def lookup(client, q):
    response = client.get("/api/laws/old-to-new/lookup", params={"q": q})
    assert response.status_code == 200
    return response.json()


@pytest.mark.parametrize(
    ("question", "old", "new_act", "new_number", "anchor"),
    [
        ("IPC 420", ("ipc", "420"), "bns-2023", "318(4)", "s-318"),
        ("498A IPC", ("ipc", "498A"), "bns-2023", "85", "s-85"),
        ("ipc section 302", ("ipc", "302"), "bns-2023", "103(1)", None),
        ("CrPC 154(3)", ("crpc", "154(3)"), "bnss-2023", "173(4)", "s-173"),
        ("Cr.P.C. 41A notice", ("crpc", "41A"), "bnss-2023", "35", "s-35"),
        ("code of criminal procedure 436A", ("crpc", "436A"), "bnss-2023", "479", "s-479"),
        ("section 65B evidence act", ("iea", "65B"), "bsa-2023", "63", "s-63"),
    ],
)
def test_old_numbers_find_their_new_ones(client, question, old, new_act, new_number, anchor):
    matches = lookup(client, question)["matches"]
    assert len(matches) == 1, matches
    m = matches[0]
    assert (m["code"], m["number"]) == old
    assert (m["new_act_id"], m["new_number"], m["anchor"]) == (new_act, new_number, anchor)


def test_a_number_without_a_code_searches_every_code(client):
    matches = lookup(client, "section 154")["matches"]
    found = {(m["code"], m["number"]) for m in matches}
    assert found == {("crpc", "154"), ("crpc", "154(3)"), ("iea", "154")}


def test_a_sub_section_falls_back_to_the_whole_section(client):
    matches = lookup(client, "IPC 420(1)")["matches"]
    assert [(m["number"], m["new_number"]) for m in matches] == [("420", "318(4)")]


def test_new_numbers_find_the_old_ones(client):
    matches = lookup(client, "BNS 318")["matches"]
    assert [(m["code"], m["number"]) for m in matches] == [("ipc", "420")]
    assert [m["number"] for m in lookup(client, "BNSS 173")["matches"]] == ["154", "154(3)"]


def test_a_section_that_was_dropped_says_so(client):
    m = lookup(client, "IPC 377")["matches"][0]
    assert m["new_number"] is None
    assert "Not carried into the BNS" in m["note"]


def test_every_match_names_its_source(client):
    out = lookup(client, "IPC 420 and CrPC 154")
    assert {s["id"] for s in out["sources"]} == {"correspondence-ipc-bns", "correspondence-crpc-bnss"}


@pytest.mark.parametrize("question", ["", "' OR 1=1 --", "ipc", "9999999", "रिश्वत"])
def test_odd_questions_are_safe(client, question):
    response = client.get("/api/laws/old-to-new/lookup", params={"q": question})
    assert response.status_code in (200, 422)
    if response.status_code == 200:
        assert response.json()["matches"] == []


def test_the_whole_table_is_listed_with_sources(client):
    codes = client.get("/api/laws/old-to-new").json()
    assert [c["short_name"] for c in codes] == ["IPC", "CrPC", "Evidence Act"]
    ipc = codes[0]
    assert ipc["new_act_short_name"] == "BNS"
    assert ipc["source"]["url"].startswith("https://")
    assert any(s["number"] == "420" and s["new_number"] == "318(4)" for s in ipc["sections"])
