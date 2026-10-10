import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { citeRecord } from "@/components/ParliamentRecord";
import { PinForm } from "@/components/PinForm";
import { RepresentativeCard } from "@/components/RepresentativeCard";
import { Ref, SourceList, SourceNotes } from "@/components/Sources";
import { ApiError, api } from "@/lib/api";
import { HOUSE_NAMES } from "@/lib/format";
import type { SeatPage } from "@/lib/types";

async function getSeat(id: string): Promise<SeatPage | null> {
  try {
    return await api<SeatPage>(`/api/seats/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps<"/seats/[id]">): Promise<Metadata> {
  const { id } = await params;
  const page = await getSeat(id).catch(() => null);
  if (!page) return { title: "Seat not found" };
  const { seat } = page;
  const house = HOUSE_NAMES[seat.house];
  return {
    title: `${seat.name}, ${seat.state}: ${house.body} seat`,
    description: seat.representative
      ? `${seat.representative.name} is the ${house.short} for ${seat.name}, ${seat.state}. With official sources.`
      : `${seat.name}, ${seat.state}, in the ${house.body}. With official sources.`,
  };
}

export default async function SeatPageView({ params }: PageProps<"/seats/[id]">) {
  const { id } = await params;
  const page = await getSeat(id);
  if (!page) notFound();
  const { seat } = page;
  const house = HOUSE_NAMES[seat.house];

  const notes = new SourceNotes();
  const seatRef = notes.cite(page.source);
  const pinRefs = page.pins_sources.map((s) => notes.cite(s));
  if (seat.representative) {
    notes.cite(seat.representative.source);
    seat.representative.facts.forEach((fact) => notes.cite(fact.source));
    citeRecord(notes, seat.representative.record);
  }

  return (
    <div>
      <p className="eyebrow">
        {house.body} constituency
        {seat.house === "lok_sabha" && (
          <>
            {" "}
            ·{" "}
            <Link href="/seats" className="link">
              all seats
            </Link>
          </>
        )}
      </p>
      <h1 className="mt-2 page-title">
        {seat.name}
        <Ref n={seatRef} source={page.source} />
      </h1>
      <p className="lede">
        {seat.state}
        {seat.reserved_for && (
          <>. Reserved for {seat.reserved_for === "SC" ? "Scheduled Castes" : "Scheduled Tribes"}</>
        )}
        .
      </p>

      <div className="mt-10 grid items-start gap-6 lg:grid-cols-2">
        <RepresentativeCard seat={seat} notes={notes} yours={false} />

        <section className="card p-5 sm:p-7" aria-labelledby="pins-heading">
          <h2 id="pins-heading" className="text-lg font-semibold">
            PIN codes in this seat
            {page.pins_sources.map((s, i) => (
              <Ref key={s.id} n={pinRefs[i]} source={s} />
            ))}
          </h2>
          {page.pins.length > 0 ? (
            <>
              <p className="mt-1 text-sm text-muted">
                PIN codes are postal areas, not electoral ones, so some are only partly in this seat.
              </p>
              <ul className="mt-4 border-t border-line">
                {page.pins.map((p) => (
                  <li key={p.pin} className="border-b border-line">
                    <Link href={`/pin/${p.pin}`} className="flex gap-3 py-2.5 hover:text-accent">
                      <span className="font-mono text-sm leading-6 text-accent">{p.pin}</span>
                      <span>{p.area}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">
              We haven&apos;t placed PIN codes in this seat yet. Your voter ID card names your constituency, and the
              Election Commission&apos;s{" "}
              <a href="https://electoralsearch.eci.gov.in/" className="link" target="_blank" rel="noopener noreferrer">
                Electoral Search
              </a>{" "}
              shows it too.
            </p>
          )}
        </section>
      </div>

      <aside className="mt-8 max-w-3xl text-sm">
        <p className="font-semibold">Spotted a mistake?</p>
        <p className="mt-1 text-muted">
          Seats and members are checked against the Lok Sabha&apos;s own list every week.{" "}
          <a
            className="link"
            href={`https://github.com/whatalshifa/civiclens/issues/new?title=${encodeURIComponent(`Data correction for ${seat.name}, ${seat.state}`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Tell us
          </a>
          .
        </p>
      </aside>

      <SourceList sources={notes.all} />

      <div className="mt-16 max-w-md">
        <h2 className="mb-2 text-base font-semibold">Look up a PIN code</h2>
        <PinForm size="sm" />
      </div>
    </div>
  );
}
