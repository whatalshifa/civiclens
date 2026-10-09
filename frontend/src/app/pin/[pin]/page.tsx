import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PinForm } from "@/components/PinForm";
import { MissingCard, RepresentativeCard } from "@/components/RepresentativeCard";
import { Ref, SourceList, SourceNotes } from "@/components/Sources";
import { ApiError, api } from "@/lib/api";
import { cleanPin } from "@/lib/format";
import type { Coverage, Place } from "@/lib/types";

async function getPlace(pin: string): Promise<Place | null> {
  try {
    return await api<Place>(`/api/places/${pin}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps<"/pin/[pin]">): Promise<Metadata> {
  const { pin } = await params;
  const place = cleanPin(pin) ? await getPlace(pin).catch(() => null) : null;
  return {
    title: place ? `Representatives for ${place.area}, ${place.state} (${place.pin})` : `PIN code ${pin}`,
    description: place
      ? `Who represents PIN code ${place.pin} in the Lok Sabha and the state assembly, with official sources.`
      : undefined,
  };
}

export default async function PinPage({ params }: PageProps<"/pin/[pin]">) {
  const { pin: raw } = await params;
  const pin = cleanPin(decodeURIComponent(raw));
  if (!pin) notFound();
  if (pin !== raw) redirect(`/pin/${pin}`);

  const place = await getPlace(pin);
  if (!place) return <NotCovered pin={pin} />;

  // Number the sources in the order the page cites them: the place first, then each card.
  const notes = new SourceNotes();
  const placeRef = notes.cite(place.source);
  const seatsRef = notes.cite(place.seats_source);
  for (const seat of place.seats) {
    if (!seat.representative) continue;
    notes.cite(seat.representative.source);
    seat.representative.facts.forEach((fact) => notes.cite(fact.source));
  }

  return (
    <div>
      <p className="eyebrow">PIN code {place.pin}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        {place.area}
        <Ref n={placeRef} source={place.source} />
      </h1>
      <p className="mt-2 text-muted">
        {place.district} district, {place.state}. These are the people elected from the seats this PIN code falls in
        <Ref n={seatsRef} source={place.seats_source} />.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {place.seats.map((seat) => (
          <RepresentativeCard key={seat.id} seat={seat} notes={notes} />
        ))}
        {place.missing.map((house) => (
          <MissingCard key={house} house={house} state={place.state} />
        ))}
      </div>

      <aside className="mt-8 rounded-2xl bg-sunken p-5 text-sm">
        <p className="font-semibold">How we show representatives</p>
        <p className="mt-1 text-muted">
          Every representative gets the same fields, in the same order, with no ratings, photos or party colours.
          Each fact links to the official record it came from. Spotted a mistake?{" "}
          <a
            className="link"
            href={`https://github.com/whatalshifa/civiclens/issues/new?title=${encodeURIComponent(`Data correction for PIN ${place.pin}`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Tell us
          </a>
          .
        </p>
      </aside>

      <SourceList sources={notes.all} />

      <div className="mt-12 max-w-md">
        <p className="mb-2 text-sm font-semibold">Look up another PIN code</p>
        <PinForm size="sm" />
      </div>
    </div>
  );
}

async function NotCovered({ pin }: { pin: string }) {
  const coverage = await api<Coverage>("/api/coverage").catch(() => null);
  return (
    <div className="mx-auto max-w-2xl">
      <p className="eyebrow">PIN code {pin}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">We don&apos;t have this PIN code yet</h1>
      <p className="mt-3 text-muted">
        CivicLens is starting with a hand-checked sample
        {coverage && (
          <>
            {" "}
            of {coverage.pincodes} PIN codes across {coverage.states.length} states
          </>
        )}
        , and is adding the rest of India from official records. Until then, your voter ID card names your
        constituencies, and the Election Commission&apos;s{" "}
        <a href="https://electoralsearch.eci.gov.in/" className="link" target="_blank" rel="noopener noreferrer">
          Electoral Search
        </a>{" "}
        shows them too.
      </p>
      {coverage && coverage.examples.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-semibold">Try one we have</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {coverage.examples.map((p) => (
              <li key={p.pin}>
                <Link href={`/pin/${p.pin}`} className="chip">
                  <span className="font-mono">{p.pin}</span>
                  <span className="text-muted">{p.area}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-8">
        <PinForm size="sm" />
      </div>
    </div>
  );
}
