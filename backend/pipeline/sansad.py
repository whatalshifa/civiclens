"""Fetches the members of the Lok Sabha from the Lok Sabha Secretariat's own website, sansad.in.

The website's member directory is built on a public JSON API. We keep only the public facts
CivicLens shows (name, party, state, constituency, whether they are sitting) and drop everything
else it returns, such as phone numbers and addresses.
"""

import json
import time
import urllib.request
from dataclasses import dataclass
from typing import Any

from pipeline.common import USER_AGENT

API = "https://sansad.in/api_ls/member?loksabha={loksabha}&page={page}&size={size}"
PAGE_SIZE = 100
LOK_SABHA = 18


@dataclass(frozen=True)
class Member:
    state: str
    constituency: str
    reserved_for: str | None  # "SC", "ST" or None
    title: str  # "Shri", "Smt.", "Dr." ...
    name: str
    party: str
    status: str  # "Sitting", "Died", "Resigned", ...
    mpsno: int | None = None  # the Lok Sabha's own member number, used by its other pages

    @classmethod
    def from_api(cls, raw: dict) -> "Member":
        category = (raw.get("categoryCode") or "").strip().strip("()").upper()
        return cls(
            state=raw["stateName"].strip(),
            constituency=raw["constName"].strip(),
            reserved_for=category if category in ("SC", "ST") else None,
            title=(raw.get("initial") or "").strip(),
            name=" ".join(raw["mpFirstLastName"].split()),
            party=" ".join(raw["partyFname"].split()),
            status=(raw.get("status") or "").strip(),
            mpsno=raw.get("mpsno"),
        )

    def public(self) -> dict:
        return {k: getattr(self, k) for k in self.__dataclass_fields__}


def fetch_members(loksabha: int = LOK_SABHA, pause: float = 1.0) -> list[Member]:
    """Every member of this Lok Sabha, sitting or not, one page of 100 at a time."""
    members: list[Member] = []
    page = 1
    while True:
        data = _get(API.format(loksabha=loksabha, page=page, size=PAGE_SIZE))
        members += [Member.from_api(m) for m in data["membersDtoList"]]
        if page >= data["metaDatasDto"]["totalPages"]:
            break
        page += 1
        time.sleep(pause)  # be gentle with a government website
    expected = data["metaDatasDto"]["totalElements"]
    if len(members) != expected:
        raise RuntimeError(f"sansad.in said {expected} members but returned {len(members)}")
    return members


QUESTIONS_API = (
    "https://sansad.in/api_ls/question/member/qetFilteredQuestionsAns"
    "?loksabhaNo={loksabha}&memberCode={mpsno}&page=1&size=1&locale=en"
)
SESSION_DATES_API = (
    "https://sansad.in/api_ls/member/attendance/session-dates?loksabha={loksabha}&session={session}"
)
ATTENDANCE_API = "https://sansad.in/api_ls/member/getMemberAttendanceMemberWise?loksabha={loksabha}&session={session}&locale=en"


def fetch_question_count(mpsno: int, loksabha: int = LOK_SABHA) -> int:
    """How many questions this member has asked in this Lok Sabha, alone or with others."""
    data = _get(QUESTIONS_API.format(loksabha=loksabha, mpsno=mpsno))
    return int(data[0]["totalRecordSize"])


@dataclass(frozen=True)
class Attendance:
    days_signed: int
    sitting_days: int  # days the House sat in the sessions this member was listed for


def fetch_attendance(loksabha: int = LOK_SABHA, pause: float = 1.0) -> tuple[dict[int, Attendance], int]:
    """Days each member signed the attendance register, over every session so far.

    Returns the members' attendance and how many sessions it covers. A member who joined in a
    by-election is only counted for the sessions they were a member for.
    """
    signed: dict[int, int] = {}
    sat: dict[int, int] = {}
    session = 0
    while True:
        dates = _get(SESSION_DATES_API.format(loksabha=loksabha, session=session + 1))
        if not dates:
            break
        session += 1
        time.sleep(pause)
        # A member can be listed twice in one session (after changing seats in the House); count
        # them once, with the larger number of days signed.
        this_session: dict[int, int] = {}
        for row in _get(ATTENDANCE_API.format(loksabha=loksabha, session=session)):
            mpsno = int(row["mpsno"])
            this_session[mpsno] = max(this_session.get(mpsno, 0), int(row["signedDaysCount"]))
        for mpsno, days in this_session.items():
            signed[mpsno] = signed.get(mpsno, 0) + min(days, len(dates))
            sat[mpsno] = sat.get(mpsno, 0) + len(dates)
        time.sleep(pause)
    return {m: Attendance(signed[m], sat[m]) for m in signed}, session


def _get(url: str, attempts: int = 3) -> Any:
    for attempt in range(1, attempts + 1):
        try:
            request = urllib.request.Request(
                url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"}
            )
            with urllib.request.urlopen(request, timeout=60) as response:
                return json.load(response)
        except (OSError, json.JSONDecodeError):
            if attempt == attempts:
                raise
            time.sleep(5 * attempt)
    raise AssertionError("unreachable")
