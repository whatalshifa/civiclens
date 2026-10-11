import type { Metadata } from "next";
import Link from "next/link";

import { IconDown, IconLeft } from "@/components/icons";
import { PaneSwitcher } from "@/components/PaneSwitcher";
import { StateMap } from "@/components/StateMap";
import { api } from "@/lib/api";
import { slugify } from "@/lib/format";
import type { StateSeats } from "@/lib/types";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Every Lok Sabha seat and its MP",
  description:
    "All 543 Lok Sabha constituencies by state, with the sitting member of each, from the Lok Sabha's own list.",
  path: "/seats",
});

/** A state with more seats than this shows the first ones, and the rest one tap away. */
const FIRST = 15;
const FOLD_OVER = 20;

/**
 * Master and detail, like a mail client: the states down the side, one state's seats beside them.
 * Each state is a pane picked by the address (/seats#kerala), so every existing link still lands on
 * its state, with or without JavaScript. On a wide screen both panes scroll inside a window-high
 * frame; on a phone the list comes first and a state replaces it, with a link back.
 */
export default async function SeatsPage() {
  const states = await api<StateSeats[]>("/api/seats");
  const total = states.reduce((n, s) => n + s.seats.length, 0);
  const vacant = states.reduce((n, s) => n + s.seats.filter((seat) => !seat.member).length, 0);

  return (
    <div>
      <h1 className="page-title">Every seat and its MP</h1>
      <p className="lede">
        All {total} Lok Sabha constituencies, by state and then name. {vacant > 0 && <>{vacant} are vacant. </>}
        Members come from the Lok Sabha&apos;s own list, checked every week; open a seat to see the source.
      </p>

      <div
        id="seat-browser"
        data-panes=""
        className="mt-6 border-2 border-rule bg-surface lg:grid lg:h-[min(40rem,calc(100dvh-8rem))] lg:grid-cols-[17rem_minmax(0,1fr)]"
      >
        <nav
          id="states"
          aria-label="States"
          data-pane-list=""
          className="lg:overflow-y-auto lg:border-r-2 lg:border-rule"
        >
          <h2 className="caps sticky top-0 z-10 border-b-2 border-rule bg-surface px-4 py-2.5 text-[0.875rem]">
            Choose a state
          </h2>
          <ul className="grid grid-cols-1 text-[0.9375rem] sm:grid-cols-2 lg:grid-cols-1">
            {states.map((s) => (
              <li key={s.state} className="border-b border-line">
                <a
                  href={`#${slugify(s.state)}`}
                  data-pane-link=""
                  className="flex min-h-11 items-baseline justify-between gap-3 px-4 py-2 hover:bg-accent-soft aria-[current]:bg-rule aria-[current]:font-bold aria-[current]:text-background"
                >
                  <span>{s.state}</span>
                  <span className="font-mono text-[0.8125rem] tabular-nums opacity-80">{s.seats.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 lg:overflow-y-auto">
          {/* Before a state is picked, a wide screen shows the tile map; a phone has the list. */}
          <section data-pane="" data-default="" aria-labelledby="pick-heading" className="p-6 max-lg:hidden!">
            <h2 id="pick-heading" className="text-xl font-extrabold [font-stretch:75%]">
              Pick a state on the list or the map
            </h2>
            <div className="mt-5 max-w-md">
              <StateMap states={states} />
            </div>
          </section>

          {states.map((s) => {
            const id = slugify(s.state);
            const fold = s.seats.length > FOLD_OVER;
            const first = fold ? s.seats.slice(0, FIRST) : s.seats;
            const rest = fold ? s.seats.slice(FIRST) : [];
            return (
              <section key={s.state} id={id} data-pane="" aria-labelledby={`${id}-heading`} className="p-4 sm:p-6">
                <a href="#states" data-pane-back="" className="link mb-3 inline-flex items-center gap-1.5 text-sm">
                  <IconLeft className="h-3 w-3" />
                  All states
                </a>
                <h2 id={`${id}-heading`} className="flex items-baseline justify-between gap-4 text-xl font-semibold">
                  {s.state}{" "}
                  <span className="text-sm font-normal text-muted tabular-nums">
                    {s.seats.length} {s.seats.length === 1 ? "seat" : "seats"}
                  </span>
                </h2>
                <SeatList seats={first} />
                {rest.length > 0 && (
                  <details className="group mt-3">
                    <summary className="caps flex min-h-11 cursor-pointer list-none items-center gap-2 border-2 border-rule px-3 text-[0.875rem] hover:bg-sunken [&::-webkit-details-marker]:hidden group-open:hidden">
                      <IconDown className="h-3.5 w-3.5 text-accent" />
                      Show all {s.seats.length} seats in {s.state}
                    </summary>
                    <SeatList seats={rest} continued />
                  </details>
                )}
              </section>
            );
          })}
        </div>
        <PaneSwitcher id="seat-browser" align="nearest" />
      </div>
    </div>
  );
}

function SeatList({ seats, continued = false }: { seats: StateSeats["seats"]; continued?: boolean }) {
  return (
    <ul
      className={`grid gap-x-8 border-line sm:grid-cols-2 xl:grid-cols-3 ${continued ? "" : "mt-3 border-t"}`}
    >
      {seats.map((seat) => (
        <li key={seat.id} className="border-b border-line">
          <Link href={`/seats/${seat.id}`} className="group block py-2">
            <span className="font-medium group-hover:text-accent group-hover:underline">{seat.name}</span>
            {seat.reserved_for && <span className="text-xs text-muted"> ({seat.reserved_for})</span>}
            <span className="block text-sm text-muted">{seat.member ? `${seat.member} · ${seat.party}` : "Vacant"}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
