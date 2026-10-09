"""The tools the rights assistant can use, and the code that runs them.

Claude never touches the database. It asks for a tool by name with some inputs ("search the
laws for 'police arrest'"); this file checks the inputs, runs the query and hands back the
result as text. Every tool only reads, so the worst a strange request can do is find nothing.

The same functions run in demo mode, where a prepared sample replays its tool calls: the steps
a visitor sees are real searches over the real data either way.
"""

import json
import re
from dataclasses import dataclass, field
from urllib.parse import urlencode

from pydantic import BaseModel, ConfigDict, Field, ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Act, Constituency, LawSection, Pincode, PincodeConstituency, Representative
from app.services.catalog import PIN_PATTERN
from app.services.search import anchor, search_laws

SEARCH_LIMIT = 6
MAX_RTI_ITEMS = 6


def cite_key(act_id: str, number: str) -> str:
    """How the assistant cites a section in its answer: [[rti-act-2005#7]]."""
    return f"{act_id}#{number}"


# ---- Inputs, checked before anything runs ----------------------------------------------------


class _Input(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class SearchLawsInput(_Input):
    query: str = Field(min_length=1, max_length=200)
    act_id: str | None = None


class ReadSectionInput(_Input):
    act_id: str = Field(min_length=1, max_length=80)
    number: str = Field(min_length=1, max_length=20)


class FindRepresentativesInput(_Input):
    pin: str = Field(min_length=6, max_length=7)


class PrepareRtiInput(_Input):
    public_authority: str = Field(min_length=2, max_length=200)
    information: list[str] = Field(min_length=1, max_length=MAX_RTI_ITEMS)


# ---- What a run has seen, for checking the answer's citations afterwards --------------------


@dataclass
class SectionRef:
    act_id: str
    act_short_name: str
    unit: str
    number: str
    title: str

    @property
    def key(self) -> str:
        return cite_key(self.act_id, self.number)

    def public(self) -> dict:
        return {
            "key": self.key,
            "act_id": self.act_id,
            "act_short_name": self.act_short_name,
            "unit": self.unit,
            "number": self.number,
            "title": self.title,
            "anchor": anchor(self.number),
        }


@dataclass
class Trace:
    """Sections the assistant has actually read in this run. Only these may be cited."""

    read: dict[str, SectionRef] = field(default_factory=dict)
    rti_link: str | None = None


@dataclass
class ToolResult:
    content: str  # what goes back to Claude
    step: dict  # what the visitor sees: a one-line summary plus anything found
    is_error: bool = False


class ToolError(Exception):
    """A problem Claude can fix by asking differently (a misspelt act id, say)."""


# ---- The tools ---------------------------------------------------------------------------


def act_catalogue(session: Session) -> list[Act]:
    return list(session.scalars(select(Act).order_by(Act.position)))


def tool_definitions(acts: list[Act]) -> list[dict]:
    """The tools as Claude sees them. `strict` makes the API guarantee inputs match the schema."""
    act_ids = [a.id for a in acts]
    return [
        {
            "name": "search_laws",
            "description": (
                "Full-text search over the plain-language summaries of the laws in the CivicLens "
                "library. Returns the best-matching sections with their summaries. Search with the "
                'words a law would use ("arrest grounds", "refund defective goods"), and search '
                "again with other words if the first results don't fit. Optionally limit the search "
                "to one act."
            ),
            "strict": True,
            "input_schema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "A few keywords."},
                    "act_id": {
                        "anyOf": [{"type": "string", "enum": act_ids}, {"type": "null"}],
                        "description": "Only search this act, or null for all acts.",
                    },
                },
                "required": ["query", "act_id"],
                "additionalProperties": False,
            },
        },
        {
            "name": "read_section",
            "description": (
                "Read one section (or article) in full: its plain-language summary, the official "
                "wording when we have it, and its source. You must read a section before you cite "
                "it in your answer."
            ),
            "strict": True,
            "input_schema": {
                "type": "object",
                "properties": {
                    "act_id": {"type": "string", "enum": act_ids},
                    "number": {"type": "string", "description": 'The section number, like "7" or "2(f)".'},
                },
                "required": ["act_id", "number"],
                "additionalProperties": False,
            },
        },
        {
            "name": "find_representatives",
            "description": (
                "Look up the Member of Parliament and Member of the Legislative Assembly for an "
                "Indian PIN code, with the election each won. Use it when the person gives a PIN "
                "code and wants to know whom to approach."
            ),
            "strict": True,
            "input_schema": {
                "type": "object",
                "properties": {"pin": {"type": "string", "description": "A six-digit PIN code."}},
                "required": ["pin"],
                "additionalProperties": False,
            },
        },
        {
            "name": "prepare_rti_request",
            "description": (
                "Prepare a link to CivicLens's RTI application drafter, filled in with the public "
                "authority and the information to ask for. Use it when the person needs information "
                "or records held by a government office. They add their own name and address on "
                "that page."
            ),
            "strict": True,
            "input_schema": {
                "type": "object",
                "properties": {
                    "public_authority": {
                        "type": "string",
                        "description": "The office that holds the information, as specifically as known.",
                    },
                    "information": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": f"Up to {MAX_RTI_ITEMS} specific items of information to ask for.",
                    },
                },
                "required": ["public_authority", "information"],
                "additionalProperties": False,
            },
        },
    ]


def search_laws_tool(session: Session, trace: Trace, args: SearchLawsInput) -> ToolResult:
    if args.act_id is not None and session.get(Act, args.act_id) is None:
        raise ToolError(f"There is no act with id {args.act_id!r}. Use null to search all acts.")
    total, hits = search_laws(session, args.query, args.act_id, limit=SEARCH_LIMIT)
    found = [
        {
            "act_id": h["act_id"],
            "act_short_name": h["act_short_name"],
            "unit": h["unit"],
            "number": h["number"],
            "title": _plain(h["title"]),
            "summary": h["summary"],
        }
        for h in hits
    ]
    content = json.dumps({"total_matches": total, "sections": found}, ensure_ascii=False)
    if not found:
        content = "No sections matched. Try different or fewer words."
    where = ""
    if args.act_id:
        where = " in the " + session.get(Act, args.act_id).short_name
    return ToolResult(
        content=content,
        step={
            "tool": "search_laws",
            "label": f"Searched the laws{where} for “{args.query}”",
            "detail": f"{total} matching section{'s' if total != 1 else ''}" if total else "Nothing matched",
            "found": [
                {k: f[k] for k in ("act_id", "act_short_name", "unit", "number", "title")} for f in found
            ],
        },
    )


def read_section_tool(session: Session, trace: Trace, args: ReadSectionInput) -> ToolResult:
    number = re.sub(r"\s", "", args.number)
    number = re.sub(r"^(section|sec\.?|s\.|article|art\.?)", "", number, flags=re.I)
    section = session.scalar(
        select(LawSection)
        .where(LawSection.act_id == args.act_id, LawSection.number == number)
        .options(selectinload(LawSection.act).selectinload(Act.source))
    )
    if section is None:
        raise ToolError(
            f"{args.act_id} has no section {args.number!r} in our library. "
            "Search first and use a number from the results."
        )
    act = section.act
    ref = SectionRef(act.id, act.short_name, act.unit, section.number, section.title)
    trace.read[ref.key] = ref
    content = json.dumps(
        {
            "cite_as": f"[[{ref.key}]]",
            "act": act.title,
            "citation": act.citation,
            act.unit.lower(): section.number,
            "title": section.title,
            "summary": section.summary,
            "official_text": section.official_text,
            "source": act.source.url,
        },
        ensure_ascii=False,
    )
    return ToolResult(
        content=content,
        step={
            "tool": "read_section",
            "label": f"Read {act.short_name} {_unit_short(act.unit)} {section.number}",
            "detail": section.title,
            "found": [ref.public()],
        },
    )


def find_representatives_tool(session: Session, trace: Trace, args: FindRepresentativesInput) -> ToolResult:
    pin = re.sub(r"\s", "", args.pin)
    if not PIN_PATTERN.match(pin):
        raise ToolError("A PIN code is six digits and doesn't start with 0.")
    place = session.scalar(
        select(Pincode)
        .where(Pincode.pin == pin)
        .options(
            selectinload(Pincode.links)
            .selectinload(PincodeConstituency.constituency)
            .selectinload(Constituency.representative)
            .selectinload(Representative.source)
        )
    )
    if place is None:
        return ToolResult(
            content=f"PIN code {pin} isn't in CivicLens's data yet. Suggest the official lookups instead.",
            step={
                "tool": "find_representatives",
                "label": f"Looked up PIN code {pin}",
                "detail": "Not in our data yet",
                "pin": pin,
            },
        )
    seats = []
    for link in sorted(place.links, key=lambda link: link.constituency.house):
        seat, rep = link.constituency, link.constituency.representative
        seats.append(
            {
                "house": "Lok Sabha" if seat.house == "lok_sabha" else "Vidhan Sabha",
                "constituency": seat.name,
                "representative": rep.name if rep else None,
                "party": rep.party if rep else None,
                "elected_in": rep.elected_in if rep else None,
                "source": rep.source.url if rep else None,
            }
        )
    content = json.dumps(
        {
            "pin": pin,
            "area": place.area,
            "district": place.district,
            "state": place.state,
            "seats": seats,
            "page": f"/pin/{pin}",
        },
        ensure_ascii=False,
    )
    return ToolResult(
        content=content,
        step={
            "tool": "find_representatives",
            "label": f"Looked up PIN code {pin}",
            "detail": f"{place.area}, {place.state}",
            "pin": pin,
        },
    )


def prepare_rti_tool(session: Session, trace: Trace, args: PrepareRtiInput) -> ToolResult:
    items = [i.strip() for i in args.information if i.strip()]
    if not items:
        raise ToolError("List at least one item of information.")
    link = "/rti?" + urlencode({"authority": args.public_authority, "info": "\n".join(items)})
    trace.rti_link = link
    return ToolResult(
        content=json.dumps({"link": link, "note": "A button to this link is shown under your answer."}),
        step={
            "tool": "prepare_rti_request",
            "label": "Prepared an RTI application",
            "detail": f"To {args.public_authority}",
            "link": link,
        },
    )


TOOLS = {
    "search_laws": (SearchLawsInput, search_laws_tool),
    "read_section": (ReadSectionInput, read_section_tool),
    "find_representatives": (FindRepresentativesInput, find_representatives_tool),
    "prepare_rti_request": (PrepareRtiInput, prepare_rti_tool),
}


def run_tool(session: Session, trace: Trace, name: str, raw_input: object) -> ToolResult:
    """Checks the inputs and runs one tool. Never raises: problems go back to Claude as errors."""
    entry = TOOLS.get(name)
    if entry is None:
        return ToolResult(f"There is no tool called {name}.", {"tool": name, "label": "Unknown tool"}, True)
    model, fn = entry
    try:
        args = model.model_validate(raw_input)
        return fn(session, trace, args)
    except ValidationError as exc:
        problems = "; ".join(f"{'.'.join(map(str, e['loc'])) or 'input'}: {e['msg']}" for e in exc.errors())
        message = f"The input didn't fit the tool: {problems}"
    except ToolError as exc:
        message = str(exc)
    return ToolResult(message, {"tool": name, "label": _failed_label(name), "detail": message}, True)


def _failed_label(name: str) -> str:
    return {
        "search_laws": "A search didn't work",
        "read_section": "Couldn't find a section",
        "find_representatives": "Couldn't look up that PIN code",
        "prepare_rti_request": "Couldn't prepare the RTI application",
    }.get(name, "A step didn't work")


def _plain(text: str) -> str:
    return text.replace("«", "").replace("»", "")


def _unit_short(unit: str) -> str:
    return "Article" if unit == "Article" else "section"
