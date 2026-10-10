"""Fetches each MP's local area development fund (MPLADS) figures from the government's eSAKSHI
dashboard, run by the Ministry of Statistics and Programme Implementation.

The public dashboard at mplads.mospi.gov.in is built on a small JSON API. It knows MPs by its own
ids and names, so this module lists the 18th Lok Sabha's MPs state by state and leaves matching
them to Lok Sabha seats to the caller.
"""

import json
import re
import time
import urllib.request
from dataclasses import dataclass
from typing import Any

from pipeline.common import USER_AGENT, state_name

BASE = "https://mplads.mospi.gov.in/rest/PreLoginDashboardData/"
LOK_SABHA = "2"  # the dashboard's code for the Lok Sabha (the Rajya Sabha is 1)
TENURE = "7"  # the dashboard's code for the 18th Lok Sabha


@dataclass(frozen=True)
class FundMp:
    id: int
    name: str
    state: str


@dataclass(frozen=True)
class Fund:
    allocated: int  # rupees, rounded
    spent: int  # on completed and ongoing works, so far
    works_recommended: int
    works_sanctioned: int
    works_completed: int


def fetch_mps(pause: float = 1.0) -> list[FundMp]:
    """Every 18th Lok Sabha MP the dashboard lists, with its state."""
    mps = []
    for state in _post("getStateData", {}):
        rows = _post("getMpNamesData", {"state_combo": f"{state['STATE_ID']},{LOK_SABHA},{TENURE}"})
        mps += [
            FundMp(int(r["ID"]), " ".join(r["CAPTION"].split()), state_name(state["STATE_NAME"]))
            for r in rows
        ]
        time.sleep(pause)
    return mps


def fetch_fund(mp_id: int) -> Fund:
    """One MP's figures for this Lok Sabha, as the dashboard's summary tiles show them."""
    tiles = _post("getTilesData", {"uname": f"0,0,{mp_id},2"})
    return parse_tiles(tiles)


def parse_tiles(tiles: dict) -> Fund:
    """The tiles give amounts as text ("₹14,70,00,000.00") and counts first in their lists."""
    return Fund(
        allocated=_rupees(tiles["Allocated Limit for Hon'ble MPs"][0]),
        spent=_rupees(tiles["Expenditure on Completed and On-going Works as on Date"][0]),
        works_recommended=int(tiles["Works Recommended"][0]),
        works_sanctioned=int(tiles["Works Sanctioned"][0]),
        works_completed=int(tiles["Works Completed"][0]),
    )


def _rupees(text: str) -> int:
    digits = re.sub(r"[^0-9.]", "", text)
    if not digits:
        raise ValueError(f"Not an amount: {text!r}")
    return round(float(digits))


def _post(name: str, body: dict, attempts: int = 3) -> Any:
    for attempt in range(1, attempts + 1):
        try:
            request = urllib.request.Request(
                BASE + name,
                data=json.dumps(body).encode(),
                headers={
                    "User-Agent": USER_AGENT,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
            )
            with urllib.request.urlopen(request, timeout=60) as response:
                return json.load(response)
        except (OSError, json.JSONDecodeError):
            if attempt == attempts:
                raise
            time.sleep(5 * attempt)
    raise AssertionError("unreachable")
