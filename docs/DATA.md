# The data, and how it stays neutral

## Where it comes from

Every fact names a source in `backend/app/data/sources.yaml`: election results from the Election
Commission of India, the Delimitation Order for which areas make up each seat, the India Post PIN
code directory, the Constitution, and India Code for Acts of Parliament.

## Two kinds of data file

- **Hand-checked** (`places.yaml`, `sources.yaml`, `laws/`): written and checked by a person.
- **Generated** (`app/data/generated/`): written by the data pipeline (`backend/pipeline`) from
  official records. Don't edit these by hand.

Where both describe the same seat or PIN code, the hand-checked file always wins. The pipeline never
changes a hand-checked entry; it compares it with the official record and reports any difference.

## What's in the data now

- **All 543 Lok Sabha seats and their sitting members**, from the Lok Sabha's member directory
  (sansad.in). 23 of them are hand-checked, with election-result dates and dated facts; the other 520
  come from the pipeline. A member list says who sits now but not when they were elected, so those
  cards say "as listed on" the date the list was read instead of a result date. Vacant seats say why
  (a member died or resigned).
- **Each sitting MP's record**: questions asked and days the attendance register was signed in
  this Lok Sabha (sansad.in), and their MPLADS fund (the eSAKSHI dashboard), refreshed weekly.
- **PIN codes**: a hand-checked sample of 25, plus whatever the PIN step below has mapped.
- **7 Vidhan Sabha seats**, hand-checked. State assemblies are a later step.
- **71 sections** of the Constitution and five Acts, summarised in plain words.

## The pipeline

Run from `backend/` after `pip install -r requirements-pipeline.txt`.

### Lok Sabha members: `python -m pipeline members`

Fetches the member list from sansad.in's public API (544 entries, including members who died or
resigned), keeps only public fields (no phone numbers, emails or addresses), and writes
`generated/lok-sabha.csv` and `generated/sources-lok-sabha.yaml`. It prints a report of what
changed since the last run and of any hand-checked seat the official list disagrees with.

`.github/workflows/refresh-data.yml` runs this every Monday. If anything changed, it runs the tests
on the new data and opens a pull request with the report; a person compares it with sansad.in and
merges it. If a hand-checked seat disagrees, it opens an issue instead, since those are fixed by hand.
Nothing reaches the website until a person merges.

The first run found two spellings where we deliberately differ from the official list (Kangana
Ranaut's name, and a misspelt party name). `listed_as` in `places.yaml` records those, so they aren't
reported every week.

### MPs' records: `python -m pipeline record`

For each sitting MP, counts the questions they asked (alone or with others) and the days they signed
the attendance register in each session, from sansad.in's public API. A member listed twice in one
session is counted once, and a member who joined in a by-election is only counted for their own
sessions. It then lists the 18th Lok Sabha MPs on the MPLADS dashboard (mplads.mospi.gov.in) state by
state, matches them to seats by name within the state, and reads each one's fund figures. Only a
plain, unambiguous name match counts; anyone else gets no fund figures and is listed in the report,
rather than risk showing someone else's numbers. It writes `generated/lok-sabha-record.csv` and
`generated/sources-lok-sabha-record.yaml`, and the weekly workflow runs it after the member step.

Ministers and the Speaker don't sign the attendance register, so they show "not recorded" rather
than zero, and every average leaves them out. The averages are worked out when the data is loaded.

### PIN codes: `python -m pipeline pins DIRECTORY.csv BOUNDARIES.geojson`

No official list says which constituency a PIN code is in, so this step works it out:

1. India Post's directory (data.gov.in, "All India Pincode Directory") lists every post office with
   its PIN code and map coordinates.
2. DataMeet's Lok Sabha boundaries
   (`parliamentary-constituencies/india_pc_2019_simplified.geojson` in
   [datameet/maps](https://github.com/datameet/maps), CC0) say where each seat is.
3. Each post office is placed in the seat whose boundary contains it. A PIN code whose offices fall
   in more than one seat is marked as partly in each, and its page tells people to check their voter
   ID. Offices without coordinates, outside India, or inside another state's seat are left out and
   counted in the report.

Assam, Jammu and Kashmir and Ladakh are skipped: their seats were redrawn after these boundaries were
made, and a wrong seat is worse than none. The step writes `generated/pincodes.csv` and
`generated/sources-pincodes.yaml`.

data.gov.in only answers requests from India, so this step can't run on GitHub's servers. Download
the directory from India, then run it locally and open a pull request with the result.

## Rules for adding data

1. Add the source first, with an `https://` link to the official record.
2. Write names and parties as the Election Commission does, in full.
3. A fact that can change (an office held) gets an `as_of` date.
4. Keep seats sorted by house, then by id (state and name). Never group or order by party.
   Generated seats are sorted by state, then name.
5. Run `pytest`: the data checks will name anything inconsistent.

## Neutrality rules the code enforces

- Every representative card shows the same fields in the same order.
- No party colours, symbols, photos, ratings or rankings anywhere.
- Seats are ordered by place (a test checks the data file's order).
- "Check their record yourself" links are the same for everyone in a house.
- MPs' records are numbers beside an average, never a score, rank, colour or "good"/"bad" label.
- Anyone can report a mistake through GitHub issues, and every data change is a public commit.
