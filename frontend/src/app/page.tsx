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
      <section className="grid items-start gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <div>
          <p className="eyebrow">Your representatives · Your rights</p>
          <h1 className="mt-3 text-5xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-7xl">
            Know who represents you, and what the law says.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Search your constituency or PIN code to see your MP and MLA. Read the laws that protect you, from RTI to arrest rights,
            explained in plain words. Each fact links to the official record it came from.
          </p>

          <div className="mt-8 border-t-[3px] border-rule pt-5">
            <h2 className="text-2xl font-bold tracking-tight">Find your representatives</h2>
            <div className="mt-3">
              <PinForm />
            </div>
            {pin === "invalid" && (
              <p className="-mt-2 mb-3 text-sm text-rose-700 dark:text-rose-300">
                Type a six-digit PIN code, like 110001, or a name, like Baramati.
              </p>
            )}
            {coverage && coverage.examples.length > 0 && (
              <div>
                <p className="text-sm text-muted">Or try one:</p>
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
            <p className="mt-4 text-sm text-muted">
              Every Lok Sabha seat can be found by name; PIN codes cover a sample of areas so far.{" "}
              <Link href="/seats" className="link">
                Browse all seats by state
              </Link>
            </p>
          </div>
        </div>

        {states.length > 0 && (
          <section className="card p-4 sm:p-5" aria-labelledby="map-heading">
            <p className="eyebrow">§ Lok Sabha</p>
            <h2 id="map-heading" className="mt-1 text-2xl font-bold tracking-tight">
              <span className="font-mono font-medium">{seats}</span> seats, state by state
            </h2>
            <div className="mt-4">
              <StateMap states={states} />
            </div>
          </section>
        )}
      </section>

      <section className="mt-16 rule-heavy grid gap-8 pt-6 lg:grid-cols-[1fr_1.1fr] lg:gap-14" aria-labelledby="rights-heading">
        <div>
          <p className="eyebrow">§ The law</p>
          <h2 id="rights-heading" className="mt-1 text-4xl font-extrabold tracking-tight">
            Your rights, in plain words
          </h2>
          <p className="mt-3 text-muted">
            Describe your problem in everyday language. CivicLens searches the Constitution and key Acts and shows the
            sections that apply, each with a link to the official text.
          </p>
          <div className="mt-5">
            <LawSearchForm label="What do you need to know?" />
          </div>
          <ul className="mt-4 flex flex-wrap gap-2">
            {QUESTIONS.map((q) => (
              <li key={q}>
                <Link href={`/laws/search?q=${encodeURIComponent(q)}`} className="chip">
                  {q}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="sr-only">Acts explained</h3>
          <ul className="border-t border-rule">
            {acts.map((act) => (
              <li key={act.id} className="border-b border-line">
                <Link href={`/laws/${act.id}`} className="flex items-baseline justify-between gap-4 py-3 hover:bg-sunken sm:px-2">
                  <span className="font-semibold">{act.short_name}</span>
                  <span className="shrink-0 text-sm text-muted">
                    <span className="font-mono text-foreground">{act.section_count}</span>{" "}
                    {act.unit === "Article" ? "articles" : "sections"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-2" aria-label="Get help with a problem">
        <Link href="/assistant" className="card group block p-6 transition-colors hover:bg-sunken">
          <p className="eyebrow">Rights assistant</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Ask about your situation</h2>
          <p className="mt-2 text-muted">
            Describe a problem in your own words. The assistant searches the law, reads the sections that apply and
            answers with every one cited. You can watch each step it takes.
          </p>
          <p className="mt-4 text-sm font-semibold text-accent">
            Try a sample question <span aria-hidden>→</span>
          </p>
        </Link>
        <Link href="/rti" className="card group block p-6 transition-colors hover:bg-sunken">
          <p className="eyebrow">Right to Information</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Draft an RTI application</h2>
          <p className="mt-2 text-muted">
            Ask any government office for its records. Fill in a short form and get a ready-to-send application in
            English or Hindi. Nothing you type leaves your browser.
          </p>
          <p className="mt-4 text-sm font-semibold text-accent">
            Start drafting <span aria-hidden>→</span>
          </p>
        </Link>
      </section>

      <section
        className="mt-16 grid gap-6 border-y-[3px] border-rule py-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-line"
        aria-label="What CivicLens promises"
      >
        <PromiseCard n={1} title="Every fact has a source">
          Names, parties, offices and laws all link to the Election Commission, Parliament, India Code or another
          official record, with the date it was true.
        </PromiseCard>
        <PromiseCard n={2} title="Strictly nonpartisan">
          Same fields for every representative, ordered by place, never by party. No ratings, no opinions, no party
          colours.
        </PromiseCard>
        <PromiseCard n={3} title="Free, and no sign-up">
          No account, no tracking cookies. CivicLens doesn&apos;t ask who you are or who you vote for.
        </PromiseCard>
      </section>

      {coverage && (
        <p className="mt-10 text-center text-sm text-muted">
          Covering{" "}
          <Link href="/seats" className="link">
            all {coverage.lok_sabha_seats} Lok Sabha seats
          </Link>{" "}
          and {coverage.pincodes.toLocaleString("en-IN")} PIN codes, from official records.{" "}
          <Link href="/about" className="link">
            How CivicLens works
          </Link>
        </p>
      )}
    </div>
  );
}

function PromiseCard({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="sm:px-6 sm:first:pl-0 sm:last:pr-0">
      <p className="eyebrow">Promise {n}</p>
      <h3 className="mt-1 text-xl font-bold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-muted">{children}</p>
    </div>
  );
}
