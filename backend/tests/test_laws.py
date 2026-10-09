import pytest

from app.services.search import anchor, query_text, tidy_snippet


def test_acts_are_listed_in_order_with_section_counts(client):
    acts = client.get("/api/laws").json()
    assert acts[0]["id"] == "constitution"
    assert acts[0]["unit"] == "Article"
    rti = next(a for a in acts if a["id"] == "rti-act-2005")
    assert rti["citation"] == "Act No. 22 of 2005"
    assert rti["section_count"] >= 10


def test_an_act_has_its_sections_with_stable_anchors(client):
    act = client.get("/api/laws/rti-act-2005").json()
    assert act["source"]["url"].startswith("https://")
    numbers = [s["number"] for s in act["sections"]]
    assert numbers[:3] == ["2(f)", "2(h)", "2(j)"]
    assert act["sections"][0]["anchor"] == "s-2-f"
    assert client.get("/api/laws/no-such-act").status_code == 404


@pytest.mark.parametrize(
    ("question", "act", "number"),
    [
        ("police refused to register my FIR", "bnss-2023", "173"),
        ("how many days does the office have to reply to my RTI", "rti-act-2005", "7"),
        ("private school asked for a donation before admission", "rte-act-2009", "13"),
        ("shop refused to refund a defective phone", "consumer-protection-act-2019", "2(47)"),
        ("can they arrest a woman at night", "bnss-2023", "43(5)"),
        ("my in-laws want to throw me out of the house", "dv-act-2005", "17"),
        ("right to privacy", "constitution", "21"),
    ],
)
def test_everyday_questions_find_the_right_section_first(client, question, act, number):
    results = client.get("/api/laws/search", params={"q": question}).json()["results"]
    assert (results[0]["act_id"], results[0]["number"]) == (act, number), [
        (r["act_id"], r["number"]) for r in results[:5]
    ]


def test_matches_are_marked_for_highlighting(client):
    hit = client.get("/api/laws/search", params={"q": "zero FIR"}).json()["results"][0]
    assert "«FIR»" in hit["title"] or "«FIR»" in hit["snippet"]
    assert hit["anchor"] == "s-173"


def test_search_can_be_limited_to_one_act(client):
    results = client.get("/api/laws/search", params={"q": "appeal", "act": "rti-act-2005"}).json()["results"]
    assert results
    assert {r["act_id"] for r in results} == {"rti-act-2005"}


def test_section_numbers_are_searchable(client):
    results = client.get("/api/laws/search", params={"q": "RTI section 19"}).json()["results"]
    assert (results[0]["act_id"], results[0]["number"]) == ("rti-act-2005", "19")


@pytest.mark.parametrize("question", ["the and of", "!!!", "' OR 1=1 --", "a & b | !c (", "रिश्वत"])
def test_odd_input_is_safe_and_may_simply_find_nothing(client, question):
    r = client.get("/api/laws/search", params={"q": question})
    assert r.status_code == 200
    assert r.json()["total"] == len(r.json()["results"]) or r.json()["total"] > 20


def test_query_text_keeps_only_letters_and_digits():
    assert query_text("Police refused my FIR!") == "police | refused | my | fir"
    assert query_text("a&b|c") == "a | b | c"
    assert query_text("--") == ""
    assert query_text("fir fir FIR") == "fir"


def test_snippets_say_where_they_were_cut():
    summary = "One two three. Four five six. Seven eight."
    assert tidy_snippet("no marks here", summary) == summary
    assert tidy_snippet("Four «five» six", summary) == "… Four «five» six …"
    assert tidy_snippet("One «two» three. Four five six. Seven eight.", summary).startswith("One")


def test_anchors():
    assert anchor("173") == "s-173"
    assert anchor("12(1)(c)") == "s-12-1-c"
    assert anchor("21A") == "s-21a"


def test_sources_are_listed(client):
    sources = client.get("/api/sources").json()
    assert {s["id"] for s in sources} >= {"eci-ge-2024", "india-code", "constitution"}
