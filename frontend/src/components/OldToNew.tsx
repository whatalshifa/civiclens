import Link from "next/link";

import type { OldSection } from "@/lib/types";

/** "IPC 420 is now BNS 318(4)", linking to the new section when the library summarises it. */
export function OldToNewMatch({ match }: { match: OldSection }) {
  const old = `${match.code_short_name} ${match.number}`;
  if (!match.new_number) {
    return (
      <div className="card p-5">
        <p className="text-lg font-semibold">{old} has no new section</p>
        {match.note && <p className="mt-2 text-sm text-muted">{match.note}</p>}
      </div>
    );
  }
  const now = `${match.new_act_short_name} ${match.new_number}`;
  return (
    <div className="card p-5">
      <p className="text-lg font-semibold">
        {old} is now <span className="text-accent">{now}</span>
      </p>
      <p className="mt-1 text-sm text-muted">{match.title}</p>
      {match.anchor && (
        <Link href={`/laws/${match.new_act_id}#${match.anchor}`} className="link mt-3 inline-block text-sm">
          Read {match.new_act_short_name} {match.new_number.split("(")[0]} in plain language
        </Link>
      )}
    </div>
  );
}
