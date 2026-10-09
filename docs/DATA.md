# The data, and how it stays neutral

## Where it comes from

Every fact names a source in `backend/app/data/sources.yaml`: election results from the Election
Commission of India, the Delimitation Order for which areas make up each seat, the India Post PIN
code directory, the Constitution, and India Code for Acts of Parliament.

## What's in Phase 1

A hand-checked sample: 25 PIN codes and 30 seats (23 Lok Sabha, 7 Vidhan Sabha) across 12 states,
and 71 sections of the Constitution and five Acts. Representatives were chosen to cover a spread of
states and parties. A scheduled pipeline in a later phase will load every PIN code and seat from
official records.

Plain-language summaries are written by CivicLens and always labelled as summaries. They simplify;
the official text is linked from every page.

## Rules for adding data

1. Add the source first, with an `https://` link to the official record.
2. Write names and parties as the Election Commission does, in full.
3. A fact that can change (an office held) gets an `as_of` date.
4. Keep seats sorted by house, then by id (state and name). Never group or order by party.
5. Run `pytest`: the data checks will name anything inconsistent.

## Neutrality rules the code enforces

- Every representative card shows the same fields in the same order.
- No party colours, symbols, photos, ratings or rankings anywhere.
- Seats are ordered by place (a test checks the data file's order).
- "Check their record yourself" links are the same for everyone in a house.
- Anyone can report a mistake through GitHub issues, and every data change is a public commit.
