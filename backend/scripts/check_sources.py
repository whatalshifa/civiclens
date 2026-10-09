"""Checks that every source link in app/data/sources.yaml still opens.

Government sites move pages around, and a dead link breaks the promise that every fact can be
checked. CI runs this as a report (python -m scripts.check_sources).

Many government sites also block automated visitors (403, 406), rate-limit them (429) or are
briefly down (5xx, timeouts). Those say nothing about whether the page exists, so they are
reported as "couldn't check". Only a missing page (404, 410) or an unknown host counts as dead,
and only dead links make the script exit with 1.
"""

import sys
import urllib.error
import urllib.request

from app.services.catalog import read_catalog

TIMEOUT_SECONDS = 30
DEAD_STATUSES = {404, 410}


def check(url: str) -> tuple[str, str]:
    """Returns ("ok" | "dead" | "unknown", detail)."""
    request = urllib.request.Request(
        url, headers={"User-Agent": "CivicLens source checker", "Accept": "text/html,*/*"}
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            return "ok", f"HTTP {response.status}"
    except urllib.error.HTTPError as exc:
        return ("dead" if exc.code in DEAD_STATUSES else "unknown"), f"HTTP {exc.code}"
    except urllib.error.URLError as exc:
        # An unknown host means the address is wrong; anything else (timeouts) is inconclusive.
        reason = str(exc.reason)
        return ("dead" if "Name or service not known" in reason else "unknown"), reason
    except Exception as exc:
        return "unknown", str(exc)


def main() -> int:
    labels = {"ok": "ok   ", "dead": "DEAD ", "unknown": "?    "}
    counts = {"ok": 0, "dead": 0, "unknown": 0}
    for url in sorted({s.url for s in read_catalog().sources}):
        result, detail = check(url)
        counts[result] += 1
        print(f"{labels[result]} {url}  ({detail})")
    print(f"\n{counts['ok']} open, {counts['unknown']} couldn't be checked, {counts['dead']} dead.")
    return 1 if counts["dead"] else 0


if __name__ == "__main__":
    sys.exit(main())
