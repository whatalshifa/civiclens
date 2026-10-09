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
  which redirects to the right page. There is deliberately no `loading.tsx`: it would wrap every page
  in a Suspense boundary, and then pages arrive hidden until JavaScript reveals them.
  `components/NavProgress.tsx` shows the "server is waking up" note after a click instead.

Sources on the PIN page work like footnotes: `SourceNotes` in `components/Sources.tsx` numbers each
source the first time the page cites it, and the list at the bottom explains each number.

## 6. The rights assistant (an AI agent)

`backend/app/services/assistant.py` answers a question like "the police arrested my brother and
won't say why" by working through the law the way a careful person would: search, read, then answer.
This is an **agent loop**:

1. Claude gets the question, the rules (only state law from sections you have read, cite each one
   like `[[bnss-2023#47]]`, stay out of politics) and four **tools**, described in
   `services/tools.py`: `search_laws`, `read_section`, `find_representatives` and
   `prepare_rti_request`.
2. Claude replies either with tool calls or with its answer. Each tool call is checked against the
   tool's schema (Pydantic models), run against the database, and its result sent back. Every tool
   only reads, so a strange request can at worst find nothing. A failed call goes back marked as an
   error, so Claude can try again differently.
3. Each step is sent to the browser the moment it happens, as **Server-Sent Events**: lines of
   `data: {...}` on one long HTTP response. The page shows them as a timeline.
4. The loop stops when Claude answers, or after 8 rounds, when tools are switched off for the last
   call so it has to answer with what it has read.
5. **Citation check.** Every `[[act#section]]` in the answer is compared with the sections Claude
   actually read in this run. A match becomes a numbered link to that section; anything else is
   removed and counted, so the page never shows a citation nobody checked.

Spending guards: 10 live questions per visitor's network per hour, 200 a day for the whole site
(counted in the `assistant_runs` table). That table records how each question went and what it
cost, but never the question itself: people describe their own troubles here, and a record that
isn't kept can't leak.

**Demo mode.** Without an API key, five sample questions in `app/data/assistant_samples.yaml`
replay their tool calls for real, through the same citation check. A test fails if a sample cites a
section it didn't read, or reads one its searches didn't find. Turning the AI on is just setting
`ANTHROPIC_API_KEY`; the samples keep working without spending anything.

The tests for the loop (`tests/test_assistant.py`) use a fake Claude that replies with scripted
tool calls, so they check the loop's logic (results sent back in one message, the last round
without tools, refusals turned into plain errors) without calling the real API.

## 7. The RTI drafter

`frontend/src/lib/rti.ts` builds an application under section 6 of the RTI Act from a short form,
in English or Hindi. It runs entirely in the browser: names and addresses never reach the server,
and a browser test checks that nothing typed is sent anywhere. The assistant's
`prepare_rti_request` tool links to it with the office and the questions filled in.

## 8. Tests

- `backend/tests/`: 72 tests against a real Postgres, covering the data checks, the API, search and
  the assistant.
- `frontend/e2e/`: Playwright drives Chromium on a desktop and a phone screen through the real
  website, API and database, and `axe` checks every page for WCAG AA accessibility in light and dark
  mode.
- GitHub Actions runs all of it on every push, plus a report-only job that checks every source link
  still opens.
