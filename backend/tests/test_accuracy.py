from sqlalchemy import delete

from app.config import Settings
from app.models import AssistantRun
from app.services import assistant


def stats(client):
    response = client.get("/api/accuracy")
    assert response.status_code == 200
    return {m["mode"]: m for m in response.json()["modes"]}


def test_live_and_demo_runs_are_counted_separately(client, session):
    session.execute(delete(AssistantRun))
    session.add_all(
        [
            AssistantRun(mode="ai", outcome="answered", citations=3, dropped_citations=1),
            AssistantRun(mode="ai", outcome="refusal"),
            AssistantRun(mode="ai", outcome="abandoned", citations=9),
            AssistantRun(mode="off", outcome="off"),
        ]
    )
    session.commit()
    list(assistant.run(session, Settings(demo_step_delay=0), "", next(iter(assistant.load_samples()))))

    by_mode = stats(client)
    assert list(by_mode) == ["ai", "demo"]
    ai, demo = by_mode["ai"], by_mode["demo"]
    # An abandoned run (the visitor left) and a switched-off search aren't answers, so aren't counted.
    assert (ai["runs"], ai["answered"], ai["failed"], ai["citations"], ai["dropped"]) == (2, 1, 1, 3, 1)
    assert (demo["runs"], demo["answered"], demo["dropped"]) == (1, 1, 0)
    assert demo["citations"] >= 1
    assert demo["first_run"] is not None


def test_no_runs_yet_shows_zeros(client, session):
    session.execute(delete(AssistantRun))
    session.commit()
    by_mode = stats(client)
    assert by_mode["ai"] == {
        "mode": "ai",
        "runs": 0,
        "answered": 0,
        "failed": 0,
        "citations": 0,
        "dropped": 0,
        "first_run": None,
    }
