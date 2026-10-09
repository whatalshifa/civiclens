"""Checks that every source link in app/data/sources.yaml still opens.

Government sites move pages around, and a dead link breaks the promise that every fact can be
checked. CI runs this as a report (python -m scripts.check_sources); it prints each link's status
and exits with 1 if any failed, so the job shows red without blocking a merge.
"""

import sys
import urllib.request

from app.services.catalog import read_catalog

TIMEOUT_SECONDS = 30


def check(url: str) -> str | None:
    """Returns None if the page opens, otherwise what went wrong."""
    request = urllib.request.Request(url, headers={"User-Agent": "CivicLens source checker"})
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            return None if response.status < 400 else f"HTTP {response.status}"
    except Exception as exc:  # timeouts, DNS failures, TLS errors and HTTP errors alike
        return str(exc)


def main() -> int:
    failed = 0
    urls = sorted({s.url for s in read_catalog().sources})
    for url in urls:
        problem = check(url)
        print(f"{'FAIL' if problem else 'ok  '} {url}{f'  ({problem})' if problem else ''}")
        failed += bool(problem)
    print(f"\n{len(urls) - failed} of {len(urls)} source links open.")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
