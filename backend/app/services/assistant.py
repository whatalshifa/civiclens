"""The rights assistant: answers a question about the law by searching and reading it, step by step.

How a live answer works (an "agent loop"):

1. Claude gets the question, a description of the four tools in tools.py, and rules: answer only
   from sections it has read, and cite each one like [[rti-act-2005#7]].
2. Claude replies either with tool calls ("search the laws for 'FIR refused'") or with its answer.
3. We run the tool calls, show the visitor each step as it happens, and send the results back.
4. Repeat until Claude answers, or until the round limit, when it must answer with what it has.
5. Every citation in the answer is checked against the sections Claude actually read. One it
   didn't read is taken out and counted, so the page never shows a citation nobody checked.

Without an API key the same pipeline replays prepared samples (data/assistant_samples.yaml):
their tool calls run for real and their answers go through the same citation check.

Everything is a stream of small events (dicts) that the API sends to the browser as they happen.
"""

import logging
import re
import time
from collections.abc import Iterator
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

import anthropic
import yaml
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.config import Settings
from app.models import AssistantRun
from app.services.tools import Trace, act_catalogue, run_tool, tool_definitions

log = logging.getLogger(__name__)

SAMPLES_FILE = Path(__file__).resolve().parent.parent / "data" / "assistant_samples.yaml"

# [[rti-act-2005#7]], [[constitution#21]], [[bnss-2023#35(3)]]
CITATION = re.compile(r"\[\[([a-z0-9-]+)#([0-9]+[A-Z]?(?:\([0-9a-z]+\))*)\]\]")

AI_OFF = (
    "The AI is switched off on this demo, so the assistant can only answer the sample questions. "
    "Here are the sections that match your words."
)

SYSTEM_PROMPT = """You are the rights assistant on CivicLens, a nonpartisan website that helps people \
in India understand their rights and the laws that apply to them.

The CivicLens law library holds plain-language summaries of selected sections of these laws:
{acts}

How to answer:
- Search the library and read the sections that apply before answering. Search again with other \
words if the first results don't fit.
- Base every statement about the law on a section you have read with read_section in this \
conversation, and cite it right after the sentence in exactly this form: [[act-id#number]], for \
example [[rti-act-2005#7]]. Never cite a section you have not read. Never state law from memory.
- If the library doesn't cover the question, say so plainly and suggest where to get help (a \
lawyer, or free legal aid from the Legal Services Authority, helpline 15100). Don't guess.
- Write for someone with no legal training, in short plain sentences. Start with a one or two \
sentence answer, then what the law says, then "What you can do" as numbered steps. Keep it under \
250 words. Use only plain text, "- " bullets, numbered lists and **bold**; no headings or tables.
- If they need records or information from a government office, call prepare_rti_request so they \
get a ready RTI application. If they give a PIN code and want to know whom to approach, call \
find_representatives.
- Stay strictly nonpartisan. Never praise, criticise or compare parties, politicians or \
governments, and don't give opinions on political questions; offer the sourced facts on CivicLens \
instead.
- This is legal information, not legal advice. If someone is in danger, tell them to call 112 first."""


class Sample(BaseModel):
    id: str = Field(pattern=r"^[a-z0-9-]+$")
    question: str
    steps: list[dict]  # {"tool": name, "input": {...}}, replayed in order
    answer: str


@lru_cache
def load_samples(path: Path = SAMPLES_FILE) -> dict[str, Sample]:
    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    samples = [Sample.model_validate(s) for s in raw]
    return {s.id: s for s in samples}


def find_sample(question: str, sample_id: str | None) -> Sample | None:
    samples = load_samples()
    if sample_id:
        return samples.get(sample_id)
    wanted = _normalise(question)
    return next((s for s in samples.values() if _normalise(s.question) == wanted), None)


def _normalise(text: str) -> str:
    return " ".join(re.findall(r"[a-z0-9]+", text.lower()))


# ---- Checking citations -----------------------------------------------------------------------


@dataclass
class CheckedAnswer:
    text: str  # with each citation replaced by {{cite:N}}
    citations: list[dict]  # N-1 -> the section
    dropped: list[str] = field(default_factory=list)


def check_citations(answer: str, trace: Trace) -> CheckedAnswer:
    """Numbers the citations to sections read in this run, and removes any others."""
    numbers: dict[str, int] = {}
    citations: list[dict] = []
    dropped: list[str] = []

    def replace(match: re.Match) -> str:
        key = f"{match.group(1)}#{match.group(2)}"
        ref = trace.read.get(key)
        if ref is None:
            dropped.append(key)
            return ""
        if key not in numbers:
            numbers[key] = len(citations) + 1
            citations.append(ref.public())
        return f"{{{{cite:{numbers[key]}}}}}"

    text = CITATION.sub(replace, answer.strip())
    # Removing a citation can leave a space before punctuation: "within 30 days ."
    text = re.sub(r"[ \t]+([.,;:])", r"\1", text)
    text = re.sub(r"(\{\{cite:\d+\}\})\s+(?=\{\{cite)", r"\1", text)
    return CheckedAnswer(text=text, citations=citations, dropped=dropped)


# ---- Running a question -----------------------------------------------------------------------


class AssistantFailed(Exception):
    def __init__(self, message: str, outcome: str = "error"):
        super().__init__(message)
        self.outcome = outcome


@dataclass
class Usage:
    rounds: int = 0
    tool_calls: int = 0
    input_tokens: int = 0
    output_tokens: int = 0


def answer_events(trace: Trace, text: str, mode: str) -> tuple[dict, CheckedAnswer]:
    checked = check_citations(text, trace)
    event = {
        "type": "answer",
        "mode": mode,
        "text": checked.text,
        "citations": checked.citations,
        "dropped": len(checked.dropped),
        "rti_link": trace.rti_link,
    }
    return event, checked


def run(
    session: Session,
    settings: Settings,
    question: str,
    sample_id: str | None = None,
    client: anthropic.Anthropic | None = None,
) -> Iterator[dict]:
    """Answers one question as a stream of events, and logs the run (without the question)."""
    sample = find_sample(question, sample_id)
    if sample is not None:
        mode = "demo"
    elif settings.ai_enabled:
        mode = "ai"
    else:
        mode = "off"

    usage = Usage()
    outcome = "answered"
    checked: CheckedAnswer | None = None
    yield {"type": "start", "mode": mode, "question": sample.question if sample else question}
    try:
        if mode == "demo":
            checked = yield from _replay(session, settings, sample, usage)
        elif mode == "ai":
            if client is None:
                client = anthropic.Anthropic(api_key=settings.anthropic_api_key, max_retries=2)
            checked = yield from _live(session, settings, client, question, usage)
        else:
            yield from _switched_off(session, question, usage)
            outcome = "off"
    except GeneratorExit:
        outcome = "abandoned"  # the visitor left before the answer finished
        raise
    except AssistantFailed as exc:
        outcome = exc.outcome
        yield {"type": "error", "message": str(exc)}
    except Exception:
        log.exception("The assistant failed")
        outcome = "error"
        yield {"type": "error", "message": "Something went wrong while answering. Please try again."}
    finally:
        session.rollback()  # tools only read; end their transaction before writing the log
        session.add(
            AssistantRun(
                mode=mode,
                outcome=outcome,
                rounds=usage.rounds,
                tool_calls=usage.tool_calls,
                input_tokens=usage.input_tokens,
                output_tokens=usage.output_tokens,
                citations=len(checked.citations) if checked else 0,
                dropped_citations=len(checked.dropped) if checked else 0,
            )
        )
        session.commit()
    yield {"type": "done"}


def _replay(session: Session, settings: Settings, sample: Sample, usage: Usage) -> Iterator[dict]:
    trace = Trace()
    for step in sample.steps:
        time.sleep(settings.demo_step_delay)
        result = run_tool(session, trace, step["tool"], step["input"])
        usage.tool_calls += 1
        yield {"type": "step", **result.step, "error": result.is_error}
    time.sleep(settings.demo_step_delay)
    event, checked = answer_events(trace, sample.answer, "demo")
    yield event
    return checked


def _switched_off(session: Session, question: str, usage: Usage) -> Iterator[dict]:
    from app.services.tools import SearchLawsInput, search_laws_tool

    trace = Trace()
    result = search_laws_tool(session, trace, SearchLawsInput(query=question[:200], act_id=None))
    usage.tool_calls += 1
    yield {"type": "step", **result.step, "error": False}
    yield {"type": "off", "message": AI_OFF}


def _live(
    session: Session, settings: Settings, client: anthropic.Anthropic, question: str, usage: Usage
) -> Iterator[dict]:
    acts = act_catalogue(session)
    system = SYSTEM_PROMPT.format(acts="\n".join(f"- {a.id}: {a.title} ({a.citation})" for a in acts))
    tools = tool_definitions(acts)
    messages: list[dict] = [{"role": "user", "content": question}]
    trace = Trace()

    while True:
        usage.rounds += 1
        last_round = usage.rounds >= settings.assistant_max_rounds
        response = _ask(client, settings, system, tools, messages, last_round)
        usage.input_tokens += response.usage.input_tokens
        usage.output_tokens += response.usage.output_tokens

        if response.stop_reason == "refusal":
            raise AssistantFailed("The AI declined to answer this question.", "refusal")
        if response.stop_reason == "max_tokens":
            raise AssistantFailed("The answer got too long. Try asking something more specific.", "too_long")

        calls = [b for b in response.content if b.type == "tool_use"]
        if response.stop_reason != "tool_use" or not calls:
            text = "".join(b.text for b in response.content if b.type == "text").strip()
            if not text:
                raise AssistantFailed("The AI didn't write an answer. Please try again.")
            event, checked = answer_events(trace, text, "ai")
            if checked.dropped:
                log.warning("Dropped citations the assistant hadn't read: %s", checked.dropped)
            yield event
            return checked

        # Send Claude's turn back unchanged (thinking blocks included), then every result at once.
        messages.append({"role": "assistant", "content": response.content})
        results = []
        for call in calls:
            result = run_tool(session, trace, call.name, call.input)
            usage.tool_calls += 1
            yield {"type": "step", **result.step, "error": result.is_error}
            block = {"type": "tool_result", "tool_use_id": call.id, "content": result.content}
            if result.is_error:
                block["is_error"] = True
            results.append(block)
        messages.append({"role": "user", "content": results})


def _ask(client, settings: Settings, system: str, tools: list[dict], messages: list[dict], last_round: bool):
    try:
        return client.beta.messages.create(
            model=settings.claude_model,
            max_tokens=16000,
            system=system,
            tools=tools,
            # On the last round tools are off, so Claude has to answer with what it has read.
            tool_choice={"type": "none"} if last_round else {"type": "auto"},
            messages=messages,
            thinking={"type": "adaptive"},
            output_config={"effort": settings.assistant_effort},
            # If a safety check declines, the API retries on a fallback model by itself.
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
        )
    except anthropic.RateLimitError as exc:
        raise AssistantFailed("The AI service is busy right now. Please try again in a minute.") from exc
    except anthropic.APIStatusError as exc:
        log.error("Claude API error %s: %s", exc.status_code, exc.message)
        raise AssistantFailed(f"The AI service returned an error ({exc.status_code}).") from exc
    except anthropic.APIConnectionError as exc:
        raise AssistantFailed("Could not reach the AI service.") from exc
