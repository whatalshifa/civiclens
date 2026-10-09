# How CivicLens works

A walk through the app, from the data files to the page someone reads. Each part names the file
where it lives, so you can open it and follow along.

## The three pieces

1. **The website** (`frontend/`, Next.js and React). Every page is built on the server.
2. **The API** (`backend/`, Python with FastAPI). Answers questions about places and laws.
3. **The database** (PostgreSQL). Holds the data and does the searching.

## 1. The data starts as files

Everything CivicLens shows comes from YAML files in `backend/app/data/`:

- `sources.yaml`: every official source (an election result, India Code, the Constitution), with its
  link and publication date.
- `places.yaml`: seats, the people who hold them, and which PIN codes fall in which seats.
- `laws/*.yaml`: one file per law, with a plain-language summary of each section.

Why files and not a form? Files can be reviewed line by line on GitHub, so every change to the data
is public and can be discussed before it goes live. That matters for a site that promises to be
nonpartisan.

## 2. Checking and loading the data

`backend/app/services/catalog.py` reads the files and checks them with Pydantic classes before
anything touches the database. It refuses data where:

- a fact names a source that doesn't exist,
- a PIN code isn't six digits starting with 1 to 9,
- a PIN code points at a seat that isn't listed,
- a PIN code sits in two Lok Sabha seats without saying each is only partly in it,
- two things share an id.

The error names the file and the problem, so whoever made the mistake can fix it.

Loading then replaces all the old rows with new ones **in one transaction**: visitors see the old
data until the moment the new data is complete, never a half-loaded mix. A Postgres advisory lock
stops two copies of the API loading at the same time, and a SHA-256 fingerprint of the files means
a restart skips loading when nothing changed.

The tables are in `backend/app/models.py`. The key design rule: every table that holds a fact has a
`source_id` column that can't be empty, so the database itself refuses an unsourced fact.

## 3. Finding representatives

`GET /api/places/{pin}` (`backend/app/api/places.py`) looks up the PIN code, follows its links to
seats, and each seat to its representative and their facts, in one query with `selectinload` (so
it doesn't make one database trip per seat). Seats come back Lok Sabha first, then Vidhan Sabha.
If a PIN has no seat in one house yet, `missing` says so, and the website shows an honest "not in
CivicLens yet" card instead of a gap.

## 4. Searching the law

This is the most interesting part. `backend/app/services/search.py` uses Postgres **full-text
search**:

- Each law section has a `search` column, computed by Postgres itself from the section's number,
  title, keywords and summary. The words are reduced to stems ("arrested" and "arrests" both become
  "arrest") and weighted: a word in the title or keywords counts more than one in the summary.
- A GIN index on that column makes searching fast, like the index at the back of a book.
- A question is cleaned down to letters and digits (so nothing a visitor types can change the
  query) and turned into "any of these words": `police | refused | fir`.
- `ts_rank` orders matches by how many of the words a section has, how rare they are and where they
  appear. `ts_headline` cuts out the part of the summary around the matching words and marks them
  with « and », which the website turns into highlights.

The tests in `backend/tests/test_laws.py` include "golden questions": everyday questions with the
section that should come first. If a change to the data or the ranking breaks one, CI fails.

## 5. The website

Pages are React **server components** (`frontend/src/app/`). They fetch from the API on the server
(`frontend/src/lib/api.ts`), so:

- the browser never talks to the API, so there's no CORS to set up, and the secret header that
  proves a request came from the website never reaches the browser;
- answers are cached for an hour, so most visitors never wait for the free-tier API to wake up;
- pages work without JavaScript. The PIN form even falls back to a plain form that goes to `/find`,
  which redirects to the right page.

Sources on the PIN page work like footnotes: `SourceNotes` in `components/Sources.tsx` numbers each
source the first time the page cites it, and the list at the bottom explains each number.

## 6. Tests

- `backend/tests/`: 46 tests against a real Postgres, covering the data checks, the API and search.
- `frontend/e2e/`: Playwright drives Chromium on a desktop and a phone screen through the real
  website, API and database, and `axe` checks every page for WCAG AA accessibility in light and dark
  mode.
- GitHub Actions runs all of it on every push, plus a report-only job that checks every source link
  still opens.
