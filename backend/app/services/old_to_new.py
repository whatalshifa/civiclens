"""Turns an old criminal-law section ("IPC 420", "CrPC 154", "65B evidence") into its new number.

The BNS, BNSS and BSA replaced the IPC, CrPC and Evidence Act on 1 July 2024, and renumbered
nearly everything. People (and chatbots) still use the old numbers. The correspondence tables in
old-to-new.yaml say which new section each old one became; this module reads a question and finds
the rows it asks about. It also works backwards: "BNS 318" finds the IPC sections it replaced.
"""

import re
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Act, LawSection, OldCode, OldSection
from app.services.search import anchor

# "420", "498A", "498 a", "65-B", "154(3)", "154 (3)". A letter only counts when it isn't the start
# of a word, so "420 of" reads as 420.
SECTION = re.compile(r"(?<![0-9a-z(])(\d{1,3})(?:\s*-?\s*([a-z])(?![a-z]))?(?:\s*\(\s*(\d{1,2})\s*\))?")
MAX_NUMBERS = 6


def section_numbers(question: str) -> list[str]:
    """'IPC 498 a and 154 (3)' -> ['498A', '154(3)']"""
    out = []
    for digits, letter, sub in SECTION.findall(question.lower()):
        number = digits + (letter or "").upper() + (f"({sub})" if sub else "")
        if number not in out:
            out.append(number)
    return out[:MAX_NUMBERS]


def base(number: str) -> str:
    """'318(4)' -> '318'"""
    return number.split("(", 1)[0]


def _mentions(text: str, phrase: str) -> bool:
    return re.search(rf"(?<![a-z]){re.escape(phrase)}(?![a-z])", text) is not None


@dataclass
class Match:
    row: OldSection
    code: OldCode


def _codes(session: Session) -> list[OldCode]:
    return list(
        session.scalars(
            select(OldCode)
            .options(
                selectinload(OldCode.sections),
                selectinload(OldCode.new_act),
                selectinload(OldCode.source),
            )
            .order_by(OldCode.position)
        )
    )


def all_codes(session: Session) -> list[OldCode]:
    return _codes(session)


def lookup(session: Session, question: str) -> list[Match]:
    text = " ".join(question.lower().split())
    numbers = section_numbers(text)
    if not numbers:
        return []
    codes = _codes(session)
    named_old = [c for c in codes if any(_mentions(text, a) for a in c.aliases.split("|"))]
    named_new = [
        c
        for c in codes
        if _mentions(text, c.new_act.short_name.lower())
        or _mentions(text, c.new_act.title.lower().removeprefix("the ").split(",")[0])
    ]

    matches: list[Match] = []
    for number in numbers:
        reverse = bool(named_new and not named_old)
        for c in named_new if reverse else (named_old or codes):
            found = [(r, r.new_number if reverse else r.number) for r in c.sections]
            found = [(r, n) for r, n in found if n]
            matches += [Match(r, c) for r in _matching(found, number)]
    unique = {id(m.row): m for m in matches}
    return list(unique.values())


def _matching(rows: list[tuple[OldSection, str]], number: str) -> list[OldSection]:
    """'154' finds 154 and its sub-sections such as 154(3); '154(3)' finds just that, or else 154."""
    if "(" not in number:
        return [r for r, n in rows if base(n) == number]
    return [r for r, n in rows if n == number] or [r for r, n in rows if n == base(number)]


def library_anchors(session: Session) -> dict[tuple[str, str], str]:
    """(act id, section number) -> anchor, for every section in the law library."""
    rows = session.execute(select(LawSection.act_id, LawSection.number)).all()
    return {(act_id, number): anchor(number) for act_id, number in rows}


def section_anchor(anchors: dict[tuple[str, str], str], act: Act, number: str | None) -> str | None:
    """The library's anchor for a new section, or for the section it is part of ('318(4)' -> s-318)."""
    if number is None:
        return None
    return anchors.get((act.id, number)) or anchors.get((act.id, base(number)))
