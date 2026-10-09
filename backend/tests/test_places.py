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
