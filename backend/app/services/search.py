"""Full-text search over the law library, done by Postgres.

Each law section has a `search` column: its words reduced to their stems ("arrested" and
"arrests" both become "arrest") with a weight for where they appear (see models.py). A
question is turned into a query that matches any of its words, and Postgres ranks sections by
how many of the words they contain, how rare those words are, and where they appear.
"""

import re

from sqlalchemy import text
from sqlalchemy.orm import Session

WORD = re.compile(r"[a-z0-9]+")
MAX_WORDS = 16

# Settings for the snippet Postgres cuts out of a summary around the matching words.
SNIPPET = 'StartSel=«, StopSel=», MaxWords=32, MinWords=14, MaxFragments=2, FragmentDelimiter=" … "'
TITLE = "StartSel=«, StopSel=», HighlightAll=true"


def query_text(question: str) -> str:
    """'Police refused my FIR!' -> 'police | refused | my | fir'.

    Only letters and digits survive, so nothing a visitor types can change the query's
    structure. Postgres drops common words like "my" and stems the rest.
    """
    words = list(dict.fromkeys(WORD.findall(question.lower())))[:MAX_WORDS]
    return " | ".join(words)


SEARCH_SQL = text(
    f"""
    WITH q AS (SELECT to_tsquery('english', :query) AS query)
    SELECT a.id AS act_id, a.short_name AS act_short_name, a.unit, s.number,
           ts_headline('english', s.title, q.query, '{TITLE}') AS title,
           ts_headline('english', s.summary, q.query, '{SNIPPET}') AS snippet, s.summary,
           count(*) OVER () AS total
    FROM law_sections s
    JOIN acts a ON a.id = s.act_id
    CROSS JOIN q
    WHERE s.search @@ q.query AND (CAST(:act AS text) IS NULL OR s.act_id = :act)
    ORDER BY ts_rank(s.search, q.query, 1) DESC, a.position, s.position
    LIMIT :limit
    """
)


def search_laws(session: Session, question: str, act: str | None = None, limit: int = 20) -> tuple[int, list]:
    query = query_text(question)
    if not query:
        return 0, []
    rows = session.execute(SEARCH_SQL, {"query": query, "act": act, "limit": limit}).mappings().all()
    hits = [{**row, "snippet": tidy_snippet(row["snippet"], row["summary"])} for row in rows]
    return (rows[0]["total"] if rows else 0), hits


def tidy_snippet(snippet: str, summary: str) -> str:
    """Show the whole summary when the match was only in the title or keywords (Postgres would cut
    an arbitrary chunk), and mark with an ellipsis where a snippet starts or ends mid-summary."""
    if "«" not in snippet:
        return summary
    plain = snippet.replace("«", "").replace("»", "")
    first, last = plain.split(" … ")[0], plain.split(" … ")[-1]
    if not summary.startswith(first):
        snippet = "… " + snippet
    if not summary.rstrip().endswith(last.rstrip()):
        snippet += " …"
    return snippet


def anchor(number: str) -> str:
    """'2(f)' -> 's-2-f', so each section has a stable address on its act's page."""
    return "s-" + "-".join(WORD.findall(number.lower()))
