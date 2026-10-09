"""Fetches the members of the Lok Sabha from the Lok Sabha Secretariat's own website, sansad.in.

The website's member directory is built on a public JSON API. We keep only the public facts
CivicLens shows (name, party, state, constituency, whether they are sitting) and drop everything
else it returns, such as phone numbers and addresses.
"""

import json
import time
import urllib.request
from dataclasses import dataclass

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


def _get(url: str, attempts: int = 3) -> dict:
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
