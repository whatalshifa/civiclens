import type { Metadata } from "next";
import Link from "next/link";

import { Highlight } from "@/components/Highlight";
import { LawSearchForm } from "@/components/LawSearchForm";
import { OldToNewMatch } from "@/components/OldToNew";
import { IconDown } from "@/components/icons";
import { api } from "@/lib/api";
import type { ActBrief, OldLookup, SearchHit, SearchResults } from "@/lib/types";
import { pageMetadata } from "@/lib/metadata";

/** The closest matches are listed; the rest wait one tap away. */
const FIRST = 8;

export async function generateMetadata({ searchParams }: PageProps<"/laws/search">): Promise<Metadata> {
  const { q } = await searchParams;
  return pageMetadata({
    title: typeof q === "string" && q ? `“${q}” in the law library` : "Search the laws",
    description: "Describe your problem in everyday words to find the sections of the law that apply.",
    noindex: true,
  });
}

export default async function SearchPage({ searchParams }: PageProps<"/laws/search">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 200) : "";
  const act = typeof params.act === "string" ? params.act : undefined;

  const acts = await api<ActBrief[]>("/api/laws");
  const query = new URLSearchParams({ q });
  if (act) query.set("act", act);
  // "IPC 420" is usually someone looking for the new number, so answer that first.
  const [results, old] = await Promise.all([
    q ? api<SearchResults>(`/api/laws/search?${query}`) : null,
    q && /\d/.test(q) ? api<OldLookup>(`/api/laws/old-to-new/lookup?${new URLSearchParams({ q })}`) : null,
  ]);
  const actName = acts.find((a) => a.id === act)?.short_name;

  return (
    <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,48rem)_16rem]">
      <div className="min-w-0">
        {!q && (
          <>
            <h1 className="page-title">Search the law in plain words</h1>
            <p className="lede mb-6">Describe what happened, the way you would tell a friend.</p>
          </>
        )}
        <LawSearchForm defaultValue={q} act={act} autoFocus={!q} />

        {act && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">Only in</span>
            <span className="badge bg-accent-soft text-accent">{actName ?? act}</span>
            <Link href={`/laws/search?q=${encodeURIComponent(q)}`} className="link">
              Search all laws
            </Link>
          </div>
        )}

        {old && old.matches.length > 0 && (
          <section className="mt-8" aria-labelledby="old-heading">
            <h2 id="old-heading" className="text-sm font-semibold text-muted">
              The old criminal laws were replaced on 1 July 2024
            </h2>
            <ul className="mt-3 grid gap-3">
              {old.matches.slice(0, 3).map((m) => (
                <li key={`${m.code}-${m.number}`}>
                  <OldToNewMatch match={m} />
                </li>
              ))}
            </ul>
            <Link href={`/laws/old-to-new?q=${encodeURIComponent(q)}`} className="link mt-2 inline-block text-sm">
              See the full old-to-new tables
            </Link>
          </section>
        )}

        {results && (
          <section className="mt-10" aria-labelledby="results-heading">
            <h1 id="results-heading" className="text-2xl font-semibold tracking-[-0.01em]" aria-live="polite">
              {results.total === 0
                ? `Nothing found for “${q}”`
                : `${results.total} ${results.total === 1 ? "section" : "sections"} match “${q}”`}
            </h1>
            {results.total > results.results.length && (
              <p className="mt-1 text-sm text-muted">Showing the {results.results.length} closest matches.</p>
            )}

            {results.total === 0 ? (
              <div className="mt-4 text-muted">
                <p>Try describing the problem with other words, like “arrest”, “refund”, “school fees” or “information”.</p>
                <p className="mt-2">
                  Or{" "}
                  <Link href="/laws" className="link">
                    browse all laws
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <>
                <Hits hits={results.results.slice(0, FIRST)} className="mt-5 border-t" />
                {results.results.length > FIRST && (
                  <details className="group">
                    <summary className="caps mt-4 flex min-h-11 w-fit cursor-pointer list-none items-center gap-2 border-2 border-rule bg-surface px-3 text-[0.875rem] hover:bg-sunken group-open:hidden [&::-webkit-details-marker]:hidden">
                      <IconDown className="h-3.5 w-3.5 text-accent" />
                      Show {results.results.length - FIRST} more {results.results.length - FIRST === 1 ? "match" : "matches"}
                    </summary>
                    <Hits hits={results.results.slice(FIRST)} start={FIRST + 1} />
                  </details>
                )}
              </>
            )}
          </section>
        )}
      </div>

      {/* Narrowing and the small print sit beside the results, not under them. */}
      <aside className="space-y-6 lg:pt-8">
        {results && !act && results.total > 0 && (
          <div>
            <h2 className="text-sm font-semibold">Search within one law</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {acts.map((a) => (
                <li key={a.id}>
                  <Link href={`/laws/search?q=${encodeURIComponent(q)}&act=${a.id}`} className="chip">
                    {a.short_name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="note text-muted">
          Search looks for your words in our plain-language summaries and the sections&apos; titles. It doesn&apos;t
          give legal advice. For help with a case, your District Legal Services Authority offers free legal aid to
          those who qualify.
        </p>
      </aside>
    </div>
  );
}

function Hits({ hits, start = 1, className = "" }: { hits: SearchHit[]; start?: number; className?: string }) {
  return (
    <ol start={start} className={`border-line ${className}`}>
      {hits.map((hit) => (
        <li key={`${hit.act_id}-${hit.number}`} className="border-b border-line">
          <Link href={`/laws/${hit.act_id}#${hit.anchor}`} className="group block py-3.5">
            <p className="text-xs font-medium text-accent">
              {hit.act_short_name} · {hit.unit} {hit.number}
            </p>
            <h2 className="mt-0.5 text-lg leading-snug font-semibold group-hover:text-accent group-hover:underline">
              <Highlight text={hit.title} />
            </h2>
            <p className="mt-1 text-[0.9375rem] leading-snug text-muted">
              <Highlight text={hit.snippet} />
            </p>
          </Link>
        </li>
      ))}
    </ol>
  );
}
