import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { LawSearchForm } from "@/components/LawSearchForm";
import { PinForm } from "@/components/PinForm";
import { StateMap } from "@/components/StateMap";
import { api } from "@/lib/api";
import type { ActBrief, Coverage, StateSeats } from "@/lib/types";

const QUESTIONS = [
  "Police won't register my FIR",
  "How long does an RTI reply take?",
  "Shop refused to refund a defective product",
  "Free seats for children in private schools",
];

export default async function Home({ searchParams }: PageProps<"/">) {
  const { pin } = await searchParams;
  const [coverage, acts, states] = await Promise.all([
    api<Coverage>("/api/coverage").catch(() => null),
    api<ActBrief[]>("/api/laws").catch(() => []),
    api<StateSeats[]>("/api/seats").catch(() => []),
  ]);
  const seats = states.reduce((n, s) => n + s.seats.length, 0);

  return (
    <div>
      <section className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:gap-16">
        <div>
          <h1 className="text-[2.125rem] leading-[1.1] font-semibold tracking-[-0.02em] text-balance sm:text-[2.75rem] lg:text-5xl">
            Know who represents you, and what the law says.
          </h1>
          <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-muted sm:text-lg">
            Search your constituency or PIN code to see your MP and MLA. Read the laws that protect you, from RTI to arrest
            rights, explained in plain words. Each fact links to the official record it came from.
          </p>

          <div className="mt-10 max-w-xl">
            <h2 className="sr-only">Find your representatives</h2>
            <PinForm />
            {pin === "invalid" && (
              <p className="mt-2 text-sm font-medium text-rose-700 dark:text-rose-300">
                Type a six-digit PIN code, like 110001, or a name, like Baramati.
              </p>
            )}
            {coverage && coverage.examples.length > 0 && (
              <p className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-muted">
                <span>Try</span>
                {coverage.examples.map((p) => (
                  <span key={p.pin}>
                    <Link href={`/pin/${p.pin}`} className="whitespace-nowrap text-accent hover:underline" title={p.area}>
                      <span className="font-mono text-[0.8125rem] font-medium">{p.pin}</span>{" "}
                      {p.area.replace(/ G\.P\.O\.$/, "").replace(/ \(.*\)$/, "")}
                    </Link>
                  </span>
                ))}
              </p>
            )}
            <p className="mt-6 border-t border-line pt-4 text-sm text-muted">
              Every Lok Sabha seat can be found by name; PIN codes cover a sample of areas so far.{" "}
              <Link href="/seats" className="link">
                Browse all seats by state
              </Link>
            </p>
          </div>
        </div>

        {states.length > 0 && (
          <section className="card p-5 sm:p-6" aria-labelledby="map-heading">
            <h2 id="map-heading" className="text-lg font-semibold">
              <span className="tabular-nums">{seats}</span> Lok Sabha seats, state by state
            </h2>
            <div className="mt-4">
              <StateMap states={states} />
            </div>
          </section>
        )}
      </section>

      <section
        className="mt-20 grid gap-10 border-t border-line pt-16 sm:mt-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:gap-16"
        aria-labelledby="rights-heading"
      >
        <div>
          <h2 id="rights-heading" className="section-title">
            Your rights, in plain words
          </h2>
          <p className="mt-3 max-w-xl text-muted">
            Describe your problem in everyday language. CivicLens searches the Constitution and key Acts and shows the
            sections that apply, each with a link to the official text.
          </p>
          <div className="mt-6 max-w-xl">
            <LawSearchForm label="What do you need to know?" quiet />
          </div>
          <div className="mt-5 max-w-xl">
            <h3 className="text-sm font-medium text-muted">Common questions</h3>
            <ul className="mt-2 space-y-1.5">
              {QUESTIONS.map((q) => (
                <li key={q}>
                  <Link href={`/laws/search?q=${encodeURIComponent(q)}`} className="link">
                    {q}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted">Acts explained</h3>
          <ul className="mt-2 border-t border-line">
            {acts.map((act) => (
              <li key={act.id} className="border-b border-line">
                <Link
                  href={`/laws/${act.id}`}
                  className="group flex items-baseline justify-between gap-4 py-3 transition-colors hover:text-accent"
                >
                  <span className="font-medium">{act.short_name}</span>
                  <span className="shrink-0 text-sm text-muted tabular-nums group-hover:text-accent">
                    {act.section_count} {act.unit === "Article" ? "articles" : "sections"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/laws" className="link mt-4 inline-flex items-center gap-1 text-sm">
            All laws in the library
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mt-20 grid gap-5 sm:mt-24 md:grid-cols-2" aria-label="Get help with a problem">
        <FeatureLink
          href="/assistant"
          eyebrow="Rights assistant"
          title="Ask about your situation"
          action="Try a sample question"
        >
          Describe a problem in your own words. The assistant searches the law, reads the sections that apply and answers
          with every one cited. You can watch each step it takes.
        </FeatureLink>
        <FeatureLink href="/rti" eyebrow="Right to Information" title="Draft an RTI application" action="Start drafting">
          Ask any government office for its records. Fill in a short form and get a ready-to-send application in English
          or Hindi. Nothing you type leaves your browser.
        </FeatureLink>
      </section>

      <section
        className="mt-20 grid gap-8 border-t border-line pt-12 sm:mt-24 sm:grid-cols-3 sm:gap-10"
        aria-label="What CivicLens promises"
      >
        <PromiseItem title="Every fact has a source">
          Names, parties, offices and laws all link to the Election Commission, Parliament, India Code or another
          official record, with the date it was true.
        </PromiseItem>
        <PromiseItem title="Strictly nonpartisan">
          Same fields for every representative, ordered by place, never by party. No ratings, no opinions, no party
          colours.
        </PromiseItem>
        <PromiseItem title="Free, and no sign-up">
          No account, no tracking cookies. CivicLens doesn&apos;t ask who you are or who you vote for.
        </PromiseItem>
      </section>

      {coverage && (
        <p className="mt-12 text-sm text-muted">
          Covering{" "}
          <Link href="/seats" className="link">
            all {coverage.lok_sabha_seats} Lok Sabha seats
          </Link>{" "}
          and <span className="tabular-nums">{coverage.pincodes.toLocaleString("en-IN")}</span> PIN codes, from official
          records.{" "}
          <Link href="/about" className="link">
            How CivicLens works
          </Link>
        </p>
      )}
    </div>
  );
}

function FeatureLink({
  href,
  eyebrow,
  title,
  action,
  children,
}: {
  href: string;
  eyebrow: string;
  title: string;
  action: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="card-link group flex flex-col p-6 sm:p-8">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-muted">{children}</p>
      <p className="mt-5 inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-accent">
        {action}
        <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </p>
    </Link>
  );
}

function PromiseItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{children}</p>
    </div>
  );
}
