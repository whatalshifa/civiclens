"""The rights assistant: samples, citation checking, the agent loop (with a fake Claude) and the API."""

import json
from types import SimpleNamespace

import pytest
from sqlalchemy import delete, func, select

from app.api.assistant import get_limiter
from app.config import Settings, get_settings
from app.models import AssistantRun
from app.services import assistant
from app.services.ratelimit import RateLimiter
from app.services.tools import SectionRef, Trace, run_tool

# ---- Samples ----------------------------------------------------------------------------------


@pytest.mark.parametrize("sample_id", list(assistant.load_samples()))
def test_every_sample_replays_cleanly(session, sample_id):
    events = list(assistant.run(session, Settings(demo_step_delay=0), "", sample_id))
    steps = [e for e in events if e["type"] == "step"]
    (answer,) = [e for e in events if e["type"] == "answer"]

    assert [e["type"] for e in events][0] == "start" and events[-1] == {"type": "done"}
    assert not any(s["error"] for s in steps), [s for s in steps if s["error"]]
    assert answer["dropped"] == 0, "the sample cites a section it didn't read"
    assert answer["citations"], "every sample answer cites the law"
    assert "[[" not in answer["text"]

    # Like a careful person, the samples only read sections a search has turned up.
    seen: set[str] = set()
    for step in steps:
        keys = {f"{f['act_id']}#{f['number']}" for f in step.get("found", [])}
        if step["tool"] == "search_laws":
            seen |= keys
        elif step["tool"] == "read_section":
            assert keys <= seen, f"{sample_id} reads {keys - seen} without finding it first"


def test_the_ration_card_sample_prepares_an_rti_application(session):
    events = list(assistant.run(session, Settings(demo_step_delay=0), "", "ration-card"))
    answer = next(e for e in events if e["type"] == "answer")
    assert answer["rti_link"].startswith("/rti?authority=")
    assert "ration+card" in answer["rti_link"]


def test_a_typed_sample_question_is_recognised():
    sample = next(iter(assistant.load_samples().values()))
    assert assistant.find_sample(sample.question.upper() + "  ", None) is sample
    assert assistant.find_sample("Something nobody prepared", None) is None


# ---- Citation checking ------------------------------------------------------------------------


def _trace(*keys: str) -> Trace:
    trace = Trace()
    for key in keys:
        act_id, number = key.split("#")
        trace.read[key] = SectionRef(act_id, act_id.upper(), "Section", number, f"Title {number}")
    return trace


def test_citations_are_numbered_in_order_and_repeats_share_a_number():
    checked = assistant.check_citations(
        "Reply in 30 days [[rti-act-2005#7]]. Appeal [[rti-act-2005#19]]. Again [[rti-act-2005#7]].",
        _trace("rti-act-2005#7", "rti-act-2005#19"),
    )
    assert checked.text == "Reply in 30 days {{cite:1}}. Appeal {{cite:2}}. Again {{cite:1}}."
    assert [c["key"] for c in checked.citations] == ["rti-act-2005#7", "rti-act-2005#19"]
    assert checked.citations[1]["anchor"] == "s-19"
    assert checked.dropped == []


def test_a_citation_to_a_section_not_read_is_removed():
    checked = assistant.check_citations(
        "Read one [[rti-act-2005#7]] and invent one [[rti-act-2005#99]].", _trace("rti-act-2005#7")
    )
    assert checked.text == "Read one {{cite:1}} and invent one."
    assert checked.dropped == ["rti-act-2005#99"]


def test_citations_with_clauses_are_understood():
    checked = assistant.check_citations("Seats [[rte-act-2009#12(1)(c)]].", _trace("rte-act-2009#12(1)(c)"))
    assert checked.text == "Seats {{cite:1}}." and checked.citations[0]["anchor"] == "s-12-1-c"


# ---- Tools ------------------------------------------------------------------------------------


def test_tools_turn_bad_input_into_errors_claude_can_fix(session):
    trace = Trace()
    wrong_act = run_tool(session, trace, "search_laws", {"query": "fee", "act_id": "no-such-act"})
    assert wrong_act.is_error and "no act" in wrong_act.content
    missing = run_tool(session, trace, "read_section", {"act_id": "rti-act-2005", "number": "999"})
    assert missing.is_error and "Search first" in missing.content
    extra = run_tool(session, trace, "read_section", {"act_id": "rti-act-2005", "number": "7", "x": 1})
    assert extra.is_error
    unknown = run_tool(session, trace, "delete_everything", {})
    assert unknown.is_error
    assert trace.read == {}


def test_read_section_accepts_a_written_out_number(session):
    trace = Trace()
    result = run_tool(session, trace, "read_section", {"act_id": "rti-act-2005", "number": "Section 7"})
    assert not result.is_error
    assert json.loads(result.content)["cite_as"] == "[[rti-act-2005#7]]"
    assert "rti-act-2005#7" in trace.read


def test_find_representatives(session):
    result = run_tool(session, Trace(), "find_representatives", {"pin": "413102"})
    data = json.loads(result.content)
    assert {s["house"] for s in data["seats"]} == {"Lok Sabha", "Vidhan Sabha"}
    unknown = run_tool(session, Trace(), "find_representatives", {"pin": "999999"})
    assert not unknown.is_error and "isn't in" in unknown.content


# ---- The live loop, with a stand-in for Claude ------------------------------------------------


def _text(text):
    return SimpleNamespace(type="text", text=text)


def _call(id, name, input):
    return SimpleNamespace(type="tool_use", id=id, name=name, input=input)


def _response(stop_reason, *content):
    return SimpleNamespace(
        stop_reason=stop_reason,
        content=list(content),
        usage=SimpleNamespace(input_tokens=100, output_tokens=20),
    )


class FakeClaude:
    """Replies with the scripted responses in order, and keeps every request it was sent."""

    def __init__(self, *responses):
        self.responses = list(responses)
        self.requests = []
        self.beta = SimpleNamespace(messages=SimpleNamespace(create=self._create))

    def _create(self, **request):
        # Copy the message list: the loop keeps appending to the same one.
        self.requests.append({**request, "messages": list(request["messages"])})
        return self.responses.pop(0)


AI_ON = Settings(anthropic_api_key="test-key", demo_step_delay=0)


def test_the_loop_runs_tools_and_checks_the_answer(session):
    thinking = SimpleNamespace(type="thinking", thinking="…", signature="sig")
    claude = FakeClaude(
        _response(
            "tool_use",
            thinking,
            _call("t1", "search_laws", {"query": "reply days fee", "act_id": "rti-act-2005"}),
            _call("t2", "read_section", {"act_id": "rti-act-2005", "number": "7"}),
        ),
        _response(
            "end_turn", _text("They must reply in 30 days [[rti-act-2005#7]]. Made up [[rti-act-2005#8]].")
        ),
    )
    events = list(assistant.run(session, AI_ON, "How long does an RTI reply take?", client=claude))

    steps = [e for e in events if e["type"] == "step"]
    assert [s["tool"] for s in steps] == ["search_laws", "read_section"]
    answer = next(e for e in events if e["type"] == "answer")
    assert answer["mode"] == "ai"
    assert answer["text"] == "They must reply in 30 days {{cite:1}}. Made up."
    assert answer["dropped"] == 1

    # Claude's turn goes back unchanged, thinking included, and both results in one message.
    second = claude.requests[1]["messages"]
    assert second[1]["role"] == "assistant"
    assert second[1]["content"][0] is thinking
    assert [r["tool_use_id"] for r in second[2]["content"]] == ["t1", "t2"]
    assert claude.requests[0]["tool_choice"] == {"type": "auto"}
    assert all(t["strict"] for t in claude.requests[0]["tools"])

    run = session.scalars(select(AssistantRun).order_by(AssistantRun.id.desc())).first()
    assert (run.mode, run.outcome, run.rounds, run.tool_calls) == ("ai", "answered", 2, 2)
    assert (run.input_tokens, run.output_tokens, run.dropped_citations) == (200, 40, 1)


def test_tool_errors_go_back_to_claude_marked_as_errors(session):
    claude = FakeClaude(
        _response("tool_use", _call("t1", "read_section", {"act_id": "rti-act-2005", "number": "999"})),
        _response("end_turn", _text("I couldn't find that section.")),
    )
    list(assistant.run(session, AI_ON, "What is section 999?", client=claude))
    result = claude.requests[1]["messages"][2]["content"][0]
    assert result["is_error"] is True


def test_on_the_last_round_claude_must_answer(session):
    search = _call("t", "search_laws", {"query": "fee", "act_id": None})
    claude = FakeClaude(
        _response("tool_use", search),
        _response("tool_use", search),
        _response("end_turn", _text("Here is what I found.")),
    )
    settings = Settings(anthropic_api_key="k", demo_step_delay=0, assistant_max_rounds=3)
    events = list(assistant.run(session, settings, "Fees?", client=claude))
    assert [r["tool_choice"]["type"] for r in claude.requests] == ["auto", "auto", "none"]
    assert next(e for e in events if e["type"] == "answer")["text"] == "Here is what I found."


@pytest.mark.parametrize(("stop_reason", "outcome"), [("refusal", "refusal"), ("max_tokens", "too_long")])
def test_a_cut_off_reply_becomes_a_plain_error(session, stop_reason, outcome):
    claude = FakeClaude(_response(stop_reason, _call("t", "search_laws", {"query": "x", "act_id": None})))
    events = list(assistant.run(session, AI_ON, "Question?", client=claude))
    assert [e["type"] for e in events] == ["start", "error", "done"]
    run = session.scalars(select(AssistantRun).order_by(AssistantRun.id.desc())).first()
    assert run.outcome == outcome and run.tool_calls == 0


def test_sample_questions_never_call_claude_even_with_a_key(session):
    claude = FakeClaude()
    question = assistant.load_samples()["faulty-phone"].question
    events = list(assistant.run(session, AI_ON, question, client=claude))
    assert next(e for e in events if e["type"] == "answer")["mode"] == "demo"
    assert claude.requests == []


def test_with_the_ai_off_other_questions_get_matching_sections(session):
    events = list(assistant.run(session, Settings(demo_step_delay=0), "Can my landlord keep my deposit?"))
    assert [e["type"] for e in events] == ["start", "step", "off", "done"]


# ---- The API ------------------------------------------------------------------------------


def _events(response) -> list[dict]:
    return [json.loads(line[6:]) for line in response.text.splitlines() if line.startswith("data: ")]


def test_info_lists_the_samples(client):
    body = client.get("/api/assistant").json()
    assert body["ai_enabled"] is False
    assert {s["id"] for s in body["samples"]} >= {"arrest", "ration-card"}


def test_ask_streams_events(client):
    response = client.post("/api/assistant/ask", json={"question": "x" * 5, "sample": "school-donation"})
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    events = _events(response)
    assert events[0]["type"] == "start" and events[-1]["type"] == "done"
    assert any(e["type"] == "answer" for e in events)


def test_ask_rejects_unknown_samples_and_bad_questions(client):
    assert client.post("/api/assistant/ask", json={"question": "hello", "sample": "nope"}).status_code == 404
    assert client.post("/api/assistant/ask", json={"question": "hi"}).status_code == 422
    assert client.post("/api/assistant/ask", json={"question": "x" * 601}).status_code == 422


def test_live_questions_are_rate_limited(client, session):
    client.app.dependency_overrides[get_settings] = lambda: AI_ON
    limiter = RateLimiter(1, 3600)
    client.app.dependency_overrides[get_limiter] = lambda: limiter
    limiter.hit("testclient")  # this visitor has used their one question
    response = client.post("/api/assistant/ask", json={"question": "What are my rights?"})
    assert response.status_code == 429

    # Samples are free: they don't touch the AI.
    assert client.post("/api/assistant/ask", json={"question": "abc", "sample": "arrest"}).status_code == 200


def test_live_questions_stop_at_the_daily_budget(client, session):
    client.app.dependency_overrides[get_settings] = lambda: Settings(
        anthropic_api_key="k", assistant_runs_per_day=1
    )
    session.add(AssistantRun(mode="ai", outcome="answered"))
    session.commit()
    try:
        response = client.post("/api/assistant/ask", json={"question": "What are my rights?"})
        assert response.status_code == 429 and "tomorrow" in response.json()["detail"]
    finally:
        session.execute(delete(AssistantRun).where(AssistantRun.mode == "ai"))
        session.commit()


def test_runs_are_logged_without_the_question(client, session):
    before = session.scalar(select(func.count()).select_from(AssistantRun))
    client.post("/api/assistant/ask", json={"question": "My secret trouble", "sample": "arrest"})
    assert session.scalar(select(func.count()).select_from(AssistantRun)) == before + 1
    assert "question" not in AssistantRun.__table__.columns
