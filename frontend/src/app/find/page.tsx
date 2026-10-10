import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PinForm } from "@/components/PinForm";
import { api } from "@/lib/api";
import { HOUSE_NAMES, readFindQuery } from "@/lib/format";
import type { PlaceSearch } from "@/lib/types";

export const metadata: Metadata = {
  title: "Find your representatives",
  description: "Search by PIN code, or by the name of a constituency, district or area.",
};

/**
 * Where the find box lands. A PIN code goes on to its page (this is also how the form works without
 * JavaScript); a name lists the matching Lok Sabha and Vidhan Sabha seats and the places we have.
 */
export default async function FindPage({ searchParams }: PageProps<"/find">) {
  const params = await searchParams;
  const raw = [params.q, params.pin].find((v) => typeof v === "string") ?? "";
  const query = readFindQuery(raw);
  if (!query) redirect("/?pin=invalid");
  if ("pin" in query) redirect(`/pin/${query.pin}`);

  const { seats, places } = await api<PlaceSearch>(`/api/places?q=${encodeURIComponent(query.name)}`);
  // One seat and nothing else: there's nothing to choose between, so open it.
  if (seats.length === 1 && places.length === 0) redirect(`/seats/${seats[0].id}`);
  const lokSabha = seats.filter((s) => s.house === "lok_sabha");
  const vidhanSabha = seats.filter((s) => s.house === "vidhan_sabha");

  return (
    <div className="mx-auto max-w-2xl">
      <p className="eyebrow">Find your representatives</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
        {seats.length + places.length > 0 ? <>Matches for &ldquo;{query.name}&rdquo;</> : <>Nothing matches &ldquo;{query.name}&rdquo;</>}
      </h1>

      {seats.length + places.length === 0 && (
        <p className="mt-3 text-muted">
          Try the constituency name as it&apos;s written on your voter ID card, or{" "}
          <Link href="/seats" className="link">
            browse every Lok Sabha seat by state
          </Link>
          . The Election Commission&apos;s{" "}
          <a href="https://electoralsearch.eci.gov.in/" className="link" target="_blank" rel="noopener noreferrer">
            Electoral Search
          </a>{" "}
          shows which constituency you vote in.
        </p>
      )}

      <SeatList title={`${HOUSE_NAMES.lok_sabha.body} seats (your MP)`} seats={lokSabha} />
      <SeatList title={`${HOUSE_NAMES.vidhan_sabha.body} seats (your MLA)`} seats={vidhanSabha} />

      {places.length > 0 && (
        <section className="mt-8" aria-labelledby="places-heading">
          <h2 id="places-heading" className="text-lg font-semibold">
            Places
          </h2>
          <ul className="mt-2">
            {places.map((p) => (
              <li key={p.pin} className="border-b border-line">
                <Link href={`/pin/${p.pin}`} className="block py-2.5 hover:bg-sunken">
                  <span className="font-medium">{p.area}</span> <span className="font-mono text-sm">{p.pin}</span>
                  <span className="block text-sm text-muted">
                    {p.district} district, {p.state}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {seats.length === 10 && (
        <p className="mt-4 text-sm text-muted">Showing the first 10 seats. Type more of the name to narrow it down.</p>
      )}

      <div className="mt-10">
        <PinForm size="sm" defaultValue={query.name} />
      </div>
    </div>
  );
}

function SeatList({ title, seats }: { title: string; seats: PlaceSearch["seats"] }) {
  if (seats.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      <ul className="mt-2">
        {seats.map((s) => (
          <li key={s.id} className="border-b border-line">
            <Link href={`/seats/${s.id}`} className="block py-2.5 hover:bg-sunken">
              <span className="font-medium">{s.name}</span>
              <span className="block text-sm text-muted">{s.state}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
