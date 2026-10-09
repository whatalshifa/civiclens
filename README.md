# CivicLens

**Know who represents you, and what the law says.** Enter a PIN code to see your MP and MLA, and
search the laws that protect you (from RTI to arrest rights) by describing your problem in everyday
words. Strictly nonpartisan: every fact links to the official record it came from.

[![CI](https://github.com/whatalshifa/civiclens/actions/workflows/ci.yml/badge.svg)](https://github.com/whatalshifa/civiclens/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-teal.svg)](LICENSE)

![The CivicLens home page](docs/screenshots/home.png)

## What it does

- **Find your representatives.** A PIN code leads to the Lok Sabha and Vidhan Sabha seats it falls
  in and the people who hold them. Every fact carries a numbered source, like a footnote, and a date.
- **Search the law in plain words.** "Police won't register my FIR" finds BNSS section 173 (Zero FIR).
  Postgres full-text search ranks 71 sections of the Constitution and five Acts, and highlights why
  each one matched.
- **Read laws simply.** Each section has a plain-language summary, clearly labelled as a summary, with
  a link to the official text.
- **Nonpartisan by design.** Same fields for everyone, ordered by place, never by party. No ratings,
  photos or party colours. The rules are enforced in the data checks and tests.
- **Works for everyone.** Server-rendered pages that work without JavaScript, on phones, in dark mode,
  and pass automated WCAG AA accessibility checks.

| Your representatives | Search the law | On a phone |
|---|---|---|
| ![MP and MLA for Baramati](docs/screenshots/representatives.png) | ![Search results](docs/screenshots/search.png) | ![Phone view](docs/screenshots/phone.png) |

## Built with

Next.js 16 (server components) · FastAPI · PostgreSQL full-text search · SQLAlchemy and Alembic ·
Playwright and axe for browser tests · GitHub Actions.

## How it fits together

```
browser ──> Next.js website ──(server-side fetch + secret header)──> FastAPI ──> Postgres
                                                                       ▲
                                         app/data/*.yaml ──checked and loaded on start
```

The data lives in reviewable YAML files. On start the API checks them (every fact must name a
source, every PIN must be valid) and loads them in one transaction. Read
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for a walk through the code and
[docs/DATA.md](docs/DATA.md) for the data and neutrality rules.

## Run it yourself

```bash
docker compose up --build      # then open http://localhost:3000
```

Or without Docker: start Postgres, then `cd backend && pip install -r requirements-dev.txt && alembic
upgrade head && uvicorn app.main:app` and `cd frontend && npm install && npm run dev`.

Tests: `cd backend && pytest` (needs Postgres; see `tests/conftest.py`) and
`cd frontend && npx playwright test`.

## Status

Phase 1: representatives for a hand-checked sample of 25 PIN codes in 12 states, and the law
library. Coming next: a rights assistant that looks up the law step by step and cites every section
it uses, help drafting RTI applications, and a scheduled pipeline that loads every PIN code and seat
from official records.

CivicLens is an independent project, not a government website, and doesn't give legal advice.
