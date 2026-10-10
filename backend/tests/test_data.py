"""Open data downloads: each dataset as CSV, matching what the pages show."""

import csv
import io

import pytest


def rows(client, dataset):
    response = client.get(f"/api/data/{dataset}.csv")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert f'filename="civiclens-{dataset}.csv"' in response.headers["content-disposition"]
    return list(csv.DictReader(io.StringIO(response.text)))


def test_every_dataset_is_listed_with_its_columns_and_size(client):
    datasets = {d["id"]: d for d in client.get("/api/data").json()}
    assert list(datasets) == ["representatives", "mp-records", "law-sections", "old-to-new", "pin-codes"]
    for d in datasets.values():
        assert d["rows"] > 0
        assert list(rows(client, d["id"])[0]) == d["columns"]


@pytest.mark.parametrize(
    "dataset", ["representatives", "mp-records", "law-sections", "old-to-new", "pin-codes"]
)
def test_every_row_names_an_official_source(client, dataset):
    for row in rows(client, dataset):
        for column, value in row.items():
            if column.endswith("source"):
                assert value.startswith("https://"), (dataset, row)


def test_seats_are_ordered_by_place_never_party(client):
    seats = [r for r in rows(client, "representatives") if r["house"] == "Lok Sabha"]
    assert len(seats) == 543
    assert [(r["state"], r["constituency"]) for r in seats] == sorted(
        (r["state"], r["constituency"]) for r in seats
    )


def test_a_download_matches_the_seat_page(client):
    record = next(r for r in rows(client, "mp-records") if r["seat_id"] == "ls-kollam")
    page = client.get("/api/seats/ls-kollam").json()["seat"]["representative"]["record"]
    assert int(record["questions"]) == page["questions"]
    assert int(record["fund_spent"]) == page["fund_spent"]


def test_ministers_have_blank_attendance_not_zero(client):
    minister = next(r for r in rows(client, "mp-records") if r["seat_id"] == "ls-lucknow")
    assert minister["days_signed"] == minister["sitting_days"] == ""


def test_an_unknown_dataset_is_a_404(client):
    assert client.get("/api/data/nothing.csv").status_code == 404
