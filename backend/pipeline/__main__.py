"""The data pipeline.

`python -m pipeline members` refreshes the Lok Sabha members; `python -m pipeline record` fetches
each MP's questions, attendance and MPLADS fund figures; `python -m pipeline pins` maps PIN codes
to seats.
"""

import argparse
import json
import sys
from datetime import date
from pathlib import Path

from pipeline import members as members_step
from pipeline.sansad import Member, fetch_members


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m pipeline", description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)

    m = commands.add_parser("members", help="Refresh Lok Sabha seats and members from sansad.in")
    m.add_argument("--from-json", type=Path, help="Use a saved member list instead of fetching it")
    m.add_argument("--save-json", type=Path, help="Also save the fetched member list here")
    m.add_argument("--report", type=Path, help="Write a Markdown summary of the changes here")
    m.add_argument("--today", type=date.fromisoformat, default=date.today())

    r = commands.add_parser("record", help="Fetch each MP's questions, attendance and MPLADS fund figures")
    r.add_argument("--report", type=Path, help="Write a Markdown summary here")
    r.add_argument("--today", type=date.fromisoformat, default=date.today())

    p = commands.add_parser("pins", help="Map PIN codes to Lok Sabha seats from India Post's directory")
    p.add_argument("directory", type=Path, help="India Post's PIN code directory (CSV, from data.gov.in)")
    p.add_argument("boundaries", type=Path, help="Lok Sabha constituency boundaries (GeoJSON)")
    p.add_argument("--report", type=Path, help="Write a Markdown summary here")

    args = parser.parse_args(argv)
    if args.command == "members":
        return run_members(args)
    if args.command == "record":
        return run_record(args)
    from pipeline import pins

    return pins.run(args)


def run_members(args) -> int:
    if args.from_json:
        people = [Member(**m) for m in json.loads(args.from_json.read_text(encoding="utf-8"))]
    else:
        people = fetch_members()
    if args.save_json:
        args.save_json.write_text(json.dumps([m.public() for m in people], indent=1, ensure_ascii=False))

    rows = members_step.build_rows(people)
    old = members_step.read_rows()
    generated, report = members_step.compare(rows, old, members_step.hand_checked_seats())
    if report.has_changes or not members_step.SEATS_FILE.exists():
        members_step.write(generated, args.today)
        print(f"Wrote {len(generated)} seats to {members_step.SEATS_FILE}")
    else:
        print("No changes in the Lok Sabha's member list.")
    summary = report.markdown(args.today)
    if args.report:
        args.report.write_text(summary, encoding="utf-8")
    print(summary)
    return 0


def run_record(args) -> int:
    from pipeline import record

    people = fetch_members()
    questions, attendance, sessions, fund_mps, funds = record.fetch(people)
    rows, report = record.build(people, questions, attendance, sessions, fund_mps, funds)
    record.write(rows, args.today, sessions)
    print(f"Wrote {len(rows)} MPs' records to {record.RECORD_FILE}")
    summary = report.markdown(args.today)
    if args.report:
        args.report.write_text(summary, encoding="utf-8")
    print(summary)
    return 0


if __name__ == "__main__":
    sys.exit(main())
