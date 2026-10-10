import Link from "next/link";

import { ParliamentRecord } from "@/components/ParliamentRecord";
import { Ref, type SourceNotes } from "@/components/Sources";
import { HOUSE_NAMES, formatDate } from "@/lib/format";
import type { Fact, House, Seat } from "@/lib/types";

// Where anyone can check a representative's record for themselves. Same links for everyone.
const LOOK_UP: Record<House, { label: string; href: string }[]> = {
  lok_sabha: [
    { label: "Lok Sabha member profile", href: "https://sansad.in/ls/members" },
    { label: "Attendance and questions (PRS)", href: "https://prsindia.org/mptrack" },
    { label: "Election affidavit (ECI)", href: "https://affidavit.eci.gov.in/" },
    { label: "Cases, assets and education (MyNeta)", href: "https://myneta.info/LokSabha2024/" },
    { label: "Fund works (MPLADS)", href: "https://mplads.mospi.gov.in/digigov/dashboard.html" },
  ],
  vidhan_sabha: [
    { label: "Election affidavit (ECI)", href: "https://affidavit.eci.gov.in/" },
    { label: "State legislatures (PRS)", href: "https://prsindia.org/" },
  ],
};

const ROLE: Record<House, string> = {
  lok_sabha:
    "Your MP speaks for you in Parliament: national laws, the Union budget, and questions to central ministries.",
  vidhan_sabha:
    "Your MLA speaks for you in the state assembly: state laws and budget, police, hospitals, schools and roads.",
};

/**
 * One seat and the person who holds it. On a PIN code page it's "your" MP; on a seat's own page
 * (`yours={false}`) it isn't, and the seat name doesn't link to the page it's already on.
 */
export function RepresentativeCard({ seat, notes, yours = true }: { seat: Seat; notes: SourceNotes; yours?: boolean }) {
  const house = HOUSE_NAMES[seat.house];
  const rep = seat.representative;
  const seatName = (
    <>
      {seat.name}, {seat.state}
      {seat.reserved_for && <> (reserved for {seat.reserved_for})</>}
    </>
  );
  return (
    <article className="card flex flex-col p-5 sm:p-6" aria-labelledby={`${seat.id}-name`}>
      <p className="eyebrow">
        {yours ? `Your ${house.short}` : house.role} · {house.body}
      </p>
      {rep ? (
        <>
          <h2 id={`${seat.id}-name`} className="mt-2 text-2xl font-bold tracking-tight">
            {rep.name}
            <Ref n={notes.cite(rep.source)} source={rep.source} />
          </h2>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted">Party</dt>
            <dd>{rep.party}</dd>
            <dt className="text-muted">Seat</dt>
            <dd>
              {yours ? (
                <Link href={`/seats/${seat.id}`} className="link">
                  {seatName}
                </Link>
              ) : (
                seatName
              )}
            </dd>
            <dt className="text-muted">Elected</dt>
            <dd>
              {rep.elected_in}
              {rep.elected_on ? (
                <>, result declared {formatDate(rep.elected_on)}</>
              ) : (
                rep.source.published_on && <>, as listed on {formatDate(rep.source.published_on)}</>
              )}
            </dd>
            {rep.facts.map((fact) => (
              <FactRow key={fact.label} fact={fact} notes={notes} />
            ))}
          </dl>
          {rep.record && <ParliamentRecord record={rep.record} notes={notes} />}
        </>
      ) : (
        <>
          <h2 id={`${seat.id}-name`} className="mt-2 text-2xl font-bold tracking-tight">
            {seat.name}
          </h2>
          <p className="mt-3 text-sm text-muted">
            {seat.vacancy
              ? `The Lok Sabha's member list shows this seat as vacant (${seat.vacancy.toLowerCase()}). It stays vacant until a by-election.`
              : `We don't have this seat's current ${house.short} yet.`}
          </p>
        </>
      )}
      {seat.partial && (
        <p className="mt-4 rounded-lg bg-sunken px-3 py-2 text-sm">
          Only part of this PIN code is in {seat.name}. Check your voter ID card or the{" "}
          <a href="https://electoralsearch.eci.gov.in/" className="link" target="_blank" rel="noopener noreferrer">
            Electoral Search
          </a>{" "}
          to be sure.
        </p>
      )}
      <p className="mt-5 text-sm text-muted">{ROLE[seat.house]}</p>
      <div className="mt-auto pt-5">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">Check their record yourself</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {LOOK_UP[seat.house].map((link) => (
            <li key={link.href}>
              <a href={link.href} className="chip text-xs" target="_blank" rel="noopener noreferrer">
                {link.label}
                <span aria-hidden>↗</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function FactRow({ fact, notes }: { fact: Fact; notes: SourceNotes }) {
  return (
    <>
      <dt className="text-muted">{fact.label}</dt>
      <dd>
        {fact.value}
        {fact.as_of && <span className="text-muted"> (as of {formatDate(fact.as_of)})</span>}
        <Ref n={notes.cite(fact.source)} source={fact.source} />
      </dd>
    </>
  );
}

export function MissingCard({ house, state }: { house: House; state: string }) {
  const names = HOUSE_NAMES[house];
  return (
    <article className="card flex flex-col border-dashed p-5 sm:p-6">
      <p className="eyebrow">
        Your {names.short} · {names.body}
      </p>
      <h2 className="mt-2 text-xl font-semibold">Not in CivicLens yet</h2>
      <p className="mt-3 text-sm text-muted">
        We haven&apos;t added the {names.body} seats for this part of {state} yet. Your voter ID card names your{" "}
        {house === "vidhan_sabha" ? "assembly" : "parliamentary"} constituency, and the Election Commission&apos;s{" "}
        <a href="https://electoralsearch.eci.gov.in/" className="link" target="_blank" rel="noopener noreferrer">
          Electoral Search
        </a>{" "}
        shows it too.
      </p>
      <p className="mt-5 text-sm text-muted">{ROLE[house]}</p>
    </article>
  );
}
