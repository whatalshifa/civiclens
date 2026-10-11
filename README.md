# CivicLens

**Live: [civiclens-ruby.vercel.app](https://civiclens-ruby.vercel.app)** · [Open the app](https://civiclens-ruby.vercel.app/services)

[![CI](https://github.com/whatalshifa/civiclens/actions/workflows/ci.yml/badge.svg)](https://github.com/whatalshifa/civiclens/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-teal.svg)](LICENSE)

**Know who represents you, and what the law says.** Search your constituency to see your MP (and,
for a sample of areas, your MLA), and search the laws that protect you, from RTI to arrest rights,
by describing your problem in everyday words. Strictly nonpartisan: every fact links to the
official record it came from.

> The API runs on a free server that sleeps when idle. The first visit after a quiet spell can take
> about a minute; the site says so and retries on its own.

![The CivicLens landing page: 543 seats, one of them is yours, with every state on a tile map](docs/screenshots/landing.png)

## The two front doors

| Route | What it is |
|---|---|
| [`/`](https://civiclens-ruby.vercel.app) | The landing page: what CivicLens is, a live search, the seat map, a real representative page, the law in plain words, a sample letter and the neutrality rules. |
| [`/services`](https://civiclens-ruby.vercel.app/services) | The app's home: find your MP and MLA, then every service under four headings (representatives, rights, letters, open data). |

Inside the app: `/seats` and `/seats/[id]` (every Lok Sabha seat), `/pin/[pin]` (a PIN code's
representatives), `/laws`, `/laws/[act]`, `/laws/search` and `/laws/old-to-new` (the law library),
`/assistant` and `/accuracy` (the rights assistant), `/rti`, `/rti/appeal` and `/letters/*` (letters
to send), and `/data` (open data).

## What it does

- **Find your representatives.** Type a constituency, district or area name, or a PIN code. All 543
  Lok Sabha seats and their sitting MPs can be found by name, from the Lok Sabha's own member list.
  Every fact carries a numbered source, like a footnote, and a date.
- **What your MP does in office.** Questions asked, attendance, and their local area development fund
  (MPLADS), each beside the average for context. Never a score or a ranking.
- **Search the law in plain words.** "Police won't register my FIR" finds BNSS section 173 (Zero FIR).
  Postgres full-text search ranks 95 sections of the Constitution and seven Acts and highlights why
  each one matched. An old-to-new lookup turns "IPC 420" into "BNS 318(4)".
- **Ask the rights assistant.** An AI agent searches the law, reads the sections that apply and
  answers in plain words, showing each step as it happens. Every citation is checked against the
  sections it actually read before you see it.
- **Draft the letter to send.** RTI application (with your state's fee and portal), RTI first appeal,
  consumer complaint and police complaint, in English or Hindi, written entirely in your browser.
- **Open data.** Every table downloads as CSV from `/data`, each row with its official source.
- **Nonpartisan by design.** Same fields for everyone, ordered by place, never by party. No ratings,
  photos or party colours, enforced in the data checks and the tests.
- **Works for everyone.** Server-rendered pages that work without JavaScript, on a 360px phone, in
  dark mode, by keyboard alone, and pass automated WCAG AA checks.

| Your representatives | Search the law | On a phone |
|---|---|---|
| ![MP and MLA for PIN code 413102, Baramati, with numbered sources](docs/screenshots/representatives.png) | ![Law search results for "police won't register my FIR"](docs/screenshots/search.png) | ![The Baramati page on a phone](docs/screenshots/phone.png) |

| The app's home | The rights assistant, step by step |
|---|---|
| ![The services home: find your MP and MLA, with the data panel](docs/screenshots/services.png) | ![The assistant answering a sample question about arrest rights](docs/screenshots/assistant.png) |

| Draft an RTI application | A law, in dark mode |
|---|---|
| ![The RTI drafter with a live letter preview](docs/screenshots/rti.png) | ![The BNSS in the law library, dark mode](docs/screenshots/law-dark.png) |

### Honest limits

- **AI runs in demo mode until an API key is set.** Without `ANTHROPIC_API_KEY` the assistant
  replays five prepared sample questions through the same tools and citation check; typed questions
  get a note saying the AI is switched off. The live site runs in demo mode.
- **PIN codes cover a hand-checked sample of 25 areas, and MLAs are listed for 7 state assembly
  seats so far.** Every Lok Sabha seat is searchable by name, but a full PIN code directory and
  every state assembly seat are not built yet; pages say plainly when an area isn't covered.
- **It gives information, not legal advice.** Answers, law pages and letters point to Tele-Law,
  free legal aid and the right helpline.

## The brand

Public signage and a data desk: a solid dark-teal bar, condensed capitals (Archivo with its width
axis), JetBrains Mono for numbers, heavy rules, square corners and solid offset shadows on anything
you can press. One signal colour, civic amber, marks notices, calls to action and keyboard focus.
Teal belongs to no major Indian party, and party names are always plain text. The emblem is a lens
with a ring of index ticks, not a government seal.

## How it fits together

```mermaid
flowchart LR
  browser([Browser]) -->|HTML, works without JS| web["Next.js 16 website<br/>server components (Vercel)"]
  web -->|server-side fetch + proxy secret<br/>cached for an hour| api["FastAPI (Render)"]
  api --> db[("Postgres (Neon)<br/>full-text search")]
  api -->|tool use, only with an API key| claude["Claude API"]
  yaml["app/data/*.yaml<br/>hand-checked, every fact sourced"] -->|checked and loaded on start| api
  official["Official records:<br/>Lok Sabha, MPLADS, India Code"] -->|weekly pipeline| pr["Pull request<br/>a person reviews it"]
  pr --> yaml
```

- The browser only ever talks to the website. Pages fetch from the API on the server with a secret
  header, so there's no CORS and the API refuses anyone else.
- Data lives in reviewable YAML and generated CSV files. On start the API checks them (every fact
  must name a source, every PIN must be valid) and loads them in one transaction.
- The assistant streams its steps to the page as Server-Sent Events through `/assistant/ask`.
- If the API is asleep, pages show a calm "waking up" state that retries by itself, and the landing
  page still renders without its numbers.

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for a walk through the code,
[docs/DATA.md](docs/DATA.md) for the data and neutrality rules and [docs/DEPLOY.md](docs/DEPLOY.md)
for deploying it on free tiers.

## Built with

| | |
|---|---|
| Website | Next.js 16 (App Router, React 19 server components), TypeScript, Tailwind CSS 4 |
| API | Python 3.12, FastAPI, SQLAlchemy 2, Alembic, Pydantic |
| Data | PostgreSQL full-text search, YAML + CSV data files, a pipeline with Shapely spatial joins |
| AI | Claude API with tool use (an agent loop), Server-Sent Events |
| Quality | Playwright + axe (WCAG AA), pytest, ruff, ESLint, GitHub Actions |
| Hosting | Vercel (website), Render (API), Neon (Postgres), all free tiers |

## Run it locally

With Docker:

```bash
docker compose up --build      # then open http://localhost:3000
```

Without Docker, you need Python 3.12+, Node 22 and Postgres 16+ with a `civiclens` user and
database (password `civiclens`):

```bash
# 1. The API, on http://localhost:8000
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env            # the defaults work with the database above
alembic upgrade head
uvicorn app.main:app --reload   # loads the data files on first start

# 2. The website, on http://localhost:3000 (in a second terminal)
cd frontend
npm ci
cp .env.example .env.local      # API_URL=http://localhost:8000
npm run dev
```

Every variable either side reads is listed, with what it does, in `backend/.env.example` and
`frontend/.env.example`. Set `ANTHROPIC_API_KEY` on the API to switch the assistant from demo mode
to live answers.

## Testing

```bash
# API: 156 tests against a real, empty Postgres database (it is wiped), plus lint
cd backend
CL_DATABASE_URL=postgresql+psycopg://civiclens:civiclens@localhost:5432/civiclens_test pytest
ruff check . && ruff format --check .

# Website: lint, type-check and build, then the browser tests
cd frontend
npm run lint && npm run build
npx playwright test             # starts the API and website itself, or reuses running ones
```

- **Backend:** pytest against real Postgres covers the data checks, every endpoint, search ranking,
  the assistant's agent loop (with a scripted fake Claude, so no API calls) and the data pipeline.
- **Browser:** Playwright drives Chromium on a desktop and a phone screen through the real website,
  API and database: the main journeys, the no-JavaScript fallbacks, metadata and keyboard use. axe
  checks every page for WCAG AA in light and dark mode, and tests check that no page scrolls sideways
  at 360px and that key pages fit in about two desktop screens.
- **CI:** GitHub Actions runs all of it on every push and pull request, checks that migrations match
  the models, and reports any official source link that stopped opening.
- **Keep-warm:** a scheduled workflow pings the API's health check on weekday working hours (India
  time) so visitors rarely meet a cold start.

## Status

- Done: all 543 Lok Sabha seats and MPs with their records, refreshed weekly through reviewed pull
  requests; search by constituency name; a law library of 95 sections with old-to-new lookup; the
  rights assistant (demo mode on the live site); RTI, appeal, consumer and police letters; open data.
- Next: every PIN code in India, and every state assembly seat and MLA.

CivicLens is an independent project, not a government website, and doesn't give legal advice.
