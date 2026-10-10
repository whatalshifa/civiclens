import type { Metadata } from "next";
import Link from "next/link";

import { api } from "@/lib/api";
import { slugify } from "@/lib/format";
import type { StateSeats } from "@/lib/types";

export const metadata: Metadata = {
  title: "Every Lok Sabha seat and its MP",
  description:
    "All 543 Lok Sabha constituencies by state, with the sitting member of each, from the Lok Sabha's own list.",
};

export default async function SeatsPage() {
  const states = await api<StateSeats[]>("/api/seats");
  const total = states.reduce((n, s) => n + s.seats.length, 0);
  const vacant = states.reduce((n, s) => n + s.seats.filter((seat) => !seat.member).length, 0);

  return (
    <div>
      <p className="eyebrow">Lok Sabha</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-6xl">Every seat and its MP</h1>
      <p className="mt-3 max-w-2xl text-muted">
        All {total} Lok Sabha constituencies, by state and then name. {vacant > 0 && <>{vacant} are vacant. </>}
        Members come from the Lok Sabha&apos;s own list, checked every week; open a seat to see the source.
      </p>

      <nav aria-label="States" className="mt-6">
        <ul className="flex flex-wrap gap-2">
          {states.map((s) => (
            <li key={s.state}>
              <a href={`#${slugify(s.state)}`} className="chip text-xs">
                {s.state}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-10 space-y-10">
        {states.map((s) => (
          <section key={s.state} aria-labelledby={slugify(s.state)} className="scroll-mt-20">
            <h2 id={slugify(s.state)} className="rule-heavy flex items-baseline justify-between pt-2 text-2xl font-extrabold">
              {s.state} <span className="font-mono text-sm font-normal text-muted">{s.seats.length} seats</span>
            </h2>
            <ul className="mt-3 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
              {s.seats.map((seat) => (
                <li key={seat.id} className="border-b border-line">
                  <Link href={`/seats/${seat.id}`} className="block py-2.5 hover:bg-sunken">
                    <span className="font-medium">{seat.name}</span>
                    {seat.reserved_for && <span className="text-xs text-muted"> ({seat.reserved_for})</span>}
                    <span className="block text-sm text-muted">
                      {seat.member ? `${seat.member} · ${seat.party}` : "Vacant"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
