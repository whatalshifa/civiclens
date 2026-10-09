def test_a_pin_shows_its_mp_then_its_mla_each_with_a_source(client):
    r = client.get("/api/places/413102")
    assert r.status_code == 200
    place = r.json()
    assert (place["area"], place["district"], place["state"]) == ("Baramati", "Pune", "Maharashtra")
    assert [s["house"] for s in place["seats"]] == ["lok_sabha", "vidhan_sabha"]
    assert place["missing"] == []

    mp = place["seats"][0]["representative"]
    assert mp["name"] == "Supriya Sule"
    assert mp["elected_on"] == "2024-06-04"
    assert mp["source"]["publisher"] == "Election Commission of India"
    assert place["source"]["id"] == "india-post-pincodes"
    assert place["seats_source"]["id"] == "delimitation-2008"


def test_facts_carry_their_own_source_and_date(client):
    mp = client.get("/api/places/221001").json()["seats"][0]["representative"]
    [fact] = mp["facts"]
    assert fact["label"] == "Office held"
    assert fact["as_of"] == "2024-06-10"
    assert fact["source"]["id"] == "council-of-ministers-2024"


def test_a_pin_without_an_mla_in_the_data_says_so(client):
    place = client.get("/api/places/221001").json()
    assert [s["house"] for s in place["seats"]] == ["lok_sabha"]
    assert place["missing"] == ["vidhan_sabha"]


def test_spaces_in_a_pin_are_ignored(client):
    assert client.get("/api/places/413%20102").json()["pin"] == "413102"


def test_malformed_and_unknown_pins(client):
    for bad in ("12345", "1234567", "012345", "abcdef"):
        r = client.get(f"/api/places/{bad}")
        assert r.status_code == 422, bad
        assert "six digits" in r.json()["detail"]
    r = client.get("/api/places/999999")
    assert r.status_code == 404
    assert "999999" in r.json()["detail"]


def test_places_can_be_found_by_name(client):
    found = client.get("/api/places", params={"q": "baramati"}).json()
    assert [p["pin"] for p in found["places"]] == ["413102"]
    assert {s["id"] for s in found["seats"]} == {"ls-baramati", "ac-mh-baramati"}
    assert found["seats"][0]["pins"] == ["413102"]

    by_district = client.get("/api/places", params={"q": "Sangrur"}).json()
    assert {p["pin"] for p in by_district["places"]} == {"148001", "148024"}

    assert client.get("/api/places", params={"q": "x"}).status_code == 422


def test_coverage_lists_examples_that_all_resolve(client):
    cov = client.get("/api/coverage").json()
    assert cov["pincodes"] >= 20
    assert cov["ai_enabled"] is False
    assert len(cov["examples"]) >= 4
    for example in cov["examples"]:
        assert client.get(f"/api/places/{example['pin']}").status_code == 200


def test_seats_are_listed_by_state_then_name_never_party(client):
    states = client.get("/api/seats").json()
    names = [s["state"] for s in states]
    assert names == sorted(names)
    seats = [seat for s in states for seat in s["seats"]]
    assert len(seats) == 543
    for s in states:
        assert [seat["name"] for seat in s["seats"]] == sorted(seat["name"] for seat in s["seats"])
    shillong = next(seat for seat in seats if seat["id"] == "ls-shillong")
    assert shillong["member"] is None and shillong["reserved_for"] == "ST"
    assert client.get("/api/seats", params={"house": "vidhan_sabha"}).json()
    assert client.get("/api/seats", params={"house": "rajya_sabha"}).status_code == 422


def test_a_seat_page_has_its_member_sources_and_pin_codes(client):
    seat = client.get("/api/seats/ls-baramati").json()
    assert seat["seat"]["representative"]["elected_on"]
    assert seat["source"]["id"] == "delimitation-2008"
    assert [p["pin"] for p in seat["pins"]] == ["413102"]
    assert [s["id"] for s in seat["pins_sources"]] == ["delimitation-2008"]

    # A seat from the official member list: no result date, since the list doesn't give one.
    listed = client.get("/api/seats/ls-kollam").json()["seat"]
    assert listed["representative"]["elected_on"] is None
    assert listed["representative"]["source"]["id"] == "lok-sabha-sitting-members"
    assert listed["representative"]["source"]["published_on"]

    vacant = client.get("/api/seats/ls-shillong").json()
    assert vacant["seat"]["representative"] is None
    assert vacant["seat"]["vacancy"] == "Previous member died"
    assert vacant["pins"] == []

    assert client.get("/api/seats/ls-nowhere").status_code == 404
    assert client.get("/api/seats/LS_BAD").status_code == 404


def test_seats_without_pin_codes_can_still_be_found_by_name(client):
    found = client.get("/api/places", params={"q": "shillong"}).json()
    assert found["seats"] == [
        {"id": "ls-shillong", "house": "lok_sabha", "name": "Shillong", "state": "Meghalaya", "pins": []}
    ]
