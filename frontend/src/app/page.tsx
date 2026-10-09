import Link from "next/link";

import { LawSearchForm } from "@/components/LawSearchForm";
import { PinForm } from "@/components/PinForm";
import { api } from "@/lib/api";
import type { ActBrief, Coverage } from "@/lib/types";

const QUESTIONS = [
  "Police won't register my FIR",
  "How long does an RTI reply take?",
  "Shop refused to refund a defective product",
  "Free seats for children in private schools",
];

export default async function Home({ searchParams }: PageProps<"/">) {
  const { pin } = await searchParams;
  const [coverage, acts] = await Promise.all([
    api<Coverage>("/api/coverage").catch(() => null),
    api<ActBrief[]>("/api/laws").catch(() => []),
  ]);

  return (
    <div>
      <section className="grid items-start gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <div>
          <p className="eyebrow">Nonpartisan · every fact sourced</p>
          <h1 className="mt-3 text-4xl leading-[1.08] font-bold tracking-tight text-balance sm:text-5xl">
            Know who represents you, and what the law says.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Enter your PIN code to see your MP and MLA. Read the laws that protect you, from RTI to arrest rights,
            explained in plain words. Each fact links to the official record it came from.
          </p>
        </div>

        <div className="card p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Find your representatives</h2>
          <div className="mt-4">
            <PinForm />
          </div>
          {pin === "invalid" && (
            <p className="-mt-2 mb-3 text-sm text-rose-700 dark:text-rose-300">
              That didn&apos;t look like a PIN code. It&apos;s six digits, like 110001.
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
        </div>
      </section>

      <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-14" aria-labelledby="rights-heading">
        <div>
          <h2 id="rights-heading" className="text-2xl font-bold tracking-tight">
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
          <ul className="grid gap-3 sm:grid-cols-2">
            {acts.map((act) => (
              <li key={act.id}>
                <Link href={`/laws/${act.id}`} className="card block h-full p-4 transition-colors hover:bg-sunken">
                  <p className="font-semibold">{act.short_name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {act.section_count} {act.unit === "Article" ? "articles" : "sections"} explained
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-16 grid gap-4 md:grid-cols-2" aria-label="Get help with a problem">
        <Link href="/assistant" className="card group block p-6 transition-colors hover:bg-sunken">
          <p className="eyebrow">Rights assistant</p>
          <h2 className="mt-2 text-xl font-bold tracking-tight">Ask about your situation</h2>
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
          <h2 className="mt-2 text-xl font-bold tracking-tight">Draft an RTI application</h2>
          <p className="mt-2 text-muted">
            Ask any government office for its records. Fill in a short form and get a ready-to-send application in
            English or Hindi. Nothing you type leaves your browser.
          </p>
          <p className="mt-4 text-sm font-semibold text-accent">
            Start drafting <span aria-hidden>→</span>
          </p>
        </Link>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-3" aria-label="What CivicLens promises">
        <PromiseCard title="Every fact has a source">
          Names, parties, offices and laws all link to the Election Commission, Parliament, India Code or another
          official record, with the date it was true.
        </PromiseCard>
        <PromiseCard title="Strictly nonpartisan">
          Same fields for every representative, ordered by place, never by party. No ratings, no opinions, no party
          colours.
        </PromiseCard>
        <PromiseCard title="Free, and no sign-up">
          No account, no tracking cookies. CivicLens doesn&apos;t ask who you are or who you vote for.
        </PromiseCard>
      </section>

      {coverage && (
        <p className="mt-10 text-center text-sm text-muted">
          Now covering a hand-checked sample of {coverage.pincodes} PIN codes and {coverage.seats} seats across{" "}
          {coverage.states.length} states, with the rest of India on the way.{" "}
          <Link href="/about" className="link">
            How CivicLens works
          </Link>
        </p>
      )}
    </div>
  );
}

function PromiseCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted">{children}</p>
    </div>
  );
}
