import { ArrowRight, ArrowUpRight, Check, Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BrowserFrame } from "@/components/landing/BrowserFrame";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LetterSample } from "@/components/landing/LetterSample";
import { SeatGrid } from "@/components/landing/SeatGrid";
import { LawSearchForm } from "@/components/LawSearchForm";
import { citeRecord } from "@/components/ParliamentRecord";
import { PinForm } from "@/components/PinForm";
import { RepresentativeCard } from "@/components/RepresentativeCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SourceList, SourceNotes } from "@/components/Sources";
import { StateMap } from "@/components/StateMap";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { buildLetter, EMPTY_DRAFT, type RtiDraft } from "@/lib/rti";
import { RTI_RULES } from "@/lib/rti-states";
import type { Accuracy, Act, AssistantInfo, ActBrief, Coverage, Dataset, Place, Source, StateSeats } from "@/lib/types";

export const metadata: Metadata = {
  title: { absolute: "CivicLens: know who represents you and what your rights are" },
};

const number = new Intl.NumberFormat("en-IN");

/** Everyday situations, each answered by one real section of the law library. */
const SITUATIONS: { says: string; ask: string; act: string; number: string }[] = [
  { says: "I’ve been arrested.", ask: "What must the police tell me?", act: "bnss-2023", number: "47" },
  { says: "The police won’t register my FIR.", ask: "Can they refuse?", act: "bnss-2023", number: "173" },
  { says: "My RTI hasn’t been answered.", ask: "How long do they have?", act: "rti-act-2005", number: "7" },
  { says: "The shop won’t take back a faulty product.", ask: "Is that allowed?", act: "consumer-protection-act-2019", number: "2(47)" },
];

/** How CivicLens stays neutral and sourced, folded in from the old About page. */
const RULES: [string, string][] = [
  ["Every fact has a source.", "If we can’t point to an official record for something, we don’t show it."],
  ["Same fields for everyone.", "Every representative gets the same rows in the same order. Seats are sorted by place, never by party."],
  ["No opinions, ratings or rankings.", "We show records. Judging them is up to you."],
  ["No party colours or symbols.", "Party names are plain text. Our teal belongs to no major party."],
  ["Dated facts.", "Offices change, so each one says when it was true and when the record was published."],
  ["Free, with no sign-up.", "No account and no tracking cookies. CivicLens never asks who you are or how you vote."],
  ["Corrections in the open.", "Anyone can report a mistake on GitHub, and every change to the data is public there."],
];

// A sample application, built by the same code as the drafter, so the preview is the real output.
const SAMPLE_RTI: RtiDraft = {
  ...EMPTY_DRAFT,
  jurisdiction: "maharashtra",
  authority: "Pune Municipal Corporation",
  information: "Copies of the road repair contract for my ward, 2024–25\nThe completion certificate for that work",
  period: "April 2024 to March 2025",
  place: "Pune",
};
const SAMPLE_RTI_LINK = `/rti?authority=${encodeURIComponent(SAMPLE_RTI.authority)}&info=${encodeURIComponent(SAMPLE_RTI.information)}`;

export default async function Landing() {
  const [coverage, acts, states, sources, datasets, accuracy, place, assistant, ...libraries] = await Promise.all([
    api<Coverage>("/api/coverage").catch(() => null),
    api<ActBrief[]>("/api/laws").catch(() => []),
    api<StateSeats[]>("/api/seats").catch(() => []),
    api<Source[]>("/api/sources").catch(() => []),
    api<Dataset[]>("/api/data").catch(() => []),
    api<Accuracy>("/api/accuracy").catch(() => null),
    api<Place>("/api/places/413102").catch(() => null),
    api<AssistantInfo>("/api/assistant").catch(() => null),
    ...["bnss-2023", "rti-act-2005", "consumer-protection-act-2019"].map((id) => api<Act>(`/api/laws/${id}`).catch(() => null)),
  ]);

  const seats = states.reduce((n, s) => n + s.seats.length, 0);
  const vacant = states.flatMap((s) => s.seats.filter((x) => !x.member));
  const sections = acts.reduce((n, a) => n + a.section_count, 0);
  const memberList = sources.find((s) => s.id === "lok-sabha-sitting-members");
  const updated = sources
    .map((s) => s.published_on)
    .filter((d): d is string => !!d)
    .sort()
    .at(-1);
  const biggest = [...states].sort((a, b) => b.seats.length - a.seats.length)[0];
  const single = states.filter((s) => s.seats.length === 1).length;

  const situations = SITUATIONS.flatMap((s) => {
    const act = libraries.find((a) => a?.id === s.act);
    const section = act?.sections.find((x) => x.number === s.number);
    return act && section ? [{ ...s, act, section }] : [];
  });

  // The other arrest rights in the BNSS, listed under the arrest question.
  const arrestRights = (libraries.find((a) => a?.id === "bnss-2023")?.sections ?? []).filter((x) =>
    ["35", "36", "38", "48", "58"].includes(x.number),
  );

  const arrestSample = assistant?.samples.find((x) => x.id === "arrest");

  const demo = accuracy?.modes.find((m) => m.mode === "demo");
  const live = accuracy?.modes.find((m) => m.mode === "ai");

  // The real Baramati page, numbered the way /pin/413102 numbers it.
  const notes = new SourceNotes();
  if (place) {
    notes.cite(place.source);
    notes.cite(place.seats_source);
    for (const seat of place.seats) {
      if (!seat.representative) continue;
      notes.cite(seat.representative.source);
      seat.representative.facts.forEach((fact) => notes.cite(fact.source));
      citeRecord(notes, seat.representative.record);
    }
  }

  // Sources grouped by who published them, for the appendix.
  const publishers = Object.entries(
    sources.reduce<Record<string, Source[]>>((acc, s) => {
      const name = s.publisher.replace(/ \(.*\)$/, "");
      (acc[name] ??= []).push(s);
      return acc;
    }, {}),
  ).sort((a, b) => b[1].length - a[1].length);

  const stats: { value: string; label: string }[] = [
    { value: number.format(seats), label: "Lok Sabha seats" },
    { value: number.format(seats - vacant.length), label: "sitting MPs listed" },
    { value: number.format(sections), label: `law sections in plain words, from ${acts.length} laws` },
    { value: number.format(datasets.length), label: "open datasets, every row sourced" },
  ];

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <LandingHeader />
      <main id="main" className="flex-1">
        {/* 1. The statement and the search, with every seat as the picture. */}
        <section id="find" aria-labelledby="hero-heading" className="relative overflow-hidden">
          <div className="mx-auto grid max-w-[75rem] items-center gap-9 px-4 pt-8 pb-16 sm:px-6 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 lg:px-8 lg:pt-20 lg:pb-24">
            <div>
              <p className="kicker text-accent">
                The 18th Lok Sabha<span className="max-sm:hidden"> · {states.length || 36} states and union territories</span>
              </p>
              <h1
                id="hero-heading"
                className="mt-5 text-[2.75rem] leading-[1] font-bold tracking-[-0.04em] text-balance sm:text-[3.75rem] lg:text-[4rem]"
              >
                {number.format(seats || 543)} seats.{" "}
                <span className="block text-accent">One of them is yours.</span>
              </h1>
              <p className="mt-5 max-w-[34rem] text-base leading-relaxed text-muted sm:mt-6 sm:text-lg">
                Find who represents you in Parliament and your state assembly, read the laws that protect you in plain
                words, and check every fact against the official record it came from.
              </p>
              <div className="mt-7 max-w-[36rem] border-t-2 border-foreground pt-5 sm:mt-9">
                <PinForm />
              </div>
              {coverage && coverage.examples.length > 0 && (
                <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-2 text-[0.9375rem]">
                  <span className="text-muted">Try</span>
                  {coverage.examples.slice(0, 3).map((p, i) => (
                    <Link key={p.pin} href={`/pin/${p.pin}`} className={`chip h-9 ${i === 2 ? "max-sm:hidden" : ""}`}>
                      <span className="font-mono text-[0.8125rem] text-accent">{p.pin}</span>
                      {p.area.replace(/ G\.P\.O\.$/, "").replace(/ \(.*\)$/, "")}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {states.length > 0 && (
              <div className="lg:pl-2">
                <div className="flex items-baseline justify-between gap-4 border-t-2 border-foreground pt-3 pb-4">
                  <p className="kicker">Fig. 1 · Lok Sabha seats by state</p>
                  <Link href="/seats" className="link shrink-0 text-sm">
                    All seats
                  </Link>
                </div>
                <StateMap
                  states={states}
                  size="lg"
                  caption="Every state gets one tile; the shade shows its seats. Choose one to open it."
                  annotation={
                    <p className="text-[0.8125rem] leading-snug text-muted">
                      <strong className="font-semibold text-foreground">{biggest?.state}</strong> elects{" "}
                      {biggest?.seats.length} MPs, the most. <strong className="font-semibold text-foreground">{single}</strong>{" "}
                      states and territories elect one.
                    </p>
                  }
                />
                {memberList && (
                  <p className="mt-3 text-[0.8125rem] text-muted">
                    Source:{" "}
                    <a href={memberList.url} className="link" target="_blank" rel="noopener noreferrer">
                      Lok Sabha Secretariat, member list
                    </a>
                    {memberList.published_on && <>, as listed {formatDate(memberList.published_on)}</>}.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 2. The whole house, seat by seat, and the numbers behind the site. */}
        <section aria-labelledby="numbers-heading" className="bg-header text-white">
          <div className="mx-auto max-w-[75rem] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16">
              <div>
                <p className="kicker text-teal-200">The whole house</p>
                <h2 id="numbers-heading" className="mt-4 text-[2rem] leading-[1.08] font-bold tracking-[-0.03em] text-balance sm:text-[2.75rem]">
                  Every seat, every MP, straight from the Lok Sabha&apos;s own list.
                </h2>
                <p className="mt-5 max-w-[30rem] text-[1.0625rem] leading-relaxed text-white/80">
                  A weekly job checks the official member list and proposes any change as a pull request, so a person
                  reviews every update before it goes live.
                </p>
                {vacant.length > 0 && (
                  <p className="mt-6 flex items-start gap-3 text-[0.9375rem] text-white/80">
                    <span aria-hidden className="mt-1 inline-block h-3.5 w-3.5 shrink-0 rounded-[3px] border-2 border-amber-300" />
                    <span>
                      <strong className="font-semibold text-white">{vacant.length} seats are vacant</strong> until a
                      by-election: {vacant.map((s) => s.name).join(", ")}.
                    </span>
                  </p>
                )}
              </div>
              {states.length > 0 && (
                <figure>
                  <SeatGrid states={states} />
                  <figcaption className="mt-3 text-[0.8125rem] text-white/70">
                    Fig. 2 · Each square is one seat, grouped by state in alphabetical order. No party colours, ever.
                  </figcaption>
                </figure>
              )}
            </div>

            <dl className="mt-14 grid grid-cols-2 border-t border-white/20 lg:mt-20 lg:grid-cols-5">
              {stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className={`flex flex-col border-b border-white/20 py-5 pr-4 lg:border-b-0 lg:py-6 ${i % 2 ? "pl-4 lg:pl-6" : "lg:pl-6"} ${i > 0 ? "lg:border-l" : "lg:pl-0"} ${i % 2 ? "border-l" : ""} border-white/20`}
                >
                  <dt className="text-sm text-white/75">{stat.label}</dt>
                  <dd className="order-first text-[2.25rem] leading-none font-bold tracking-[-0.03em] tabular-nums sm:text-[2.75rem]">
                    {stat.value}
                  </dd>
                </div>
              ))}
              {updated && (
                <div className="col-span-2 flex flex-col py-5 lg:col-span-1 lg:border-l lg:border-white/20 lg:py-6 lg:pl-6">
                  <dt className="text-sm text-white/75">last record published</dt>
                  <dd className="order-first text-[1.5rem] leading-[1.15] font-bold tracking-[-0.02em] sm:text-[1.75rem]">
                    <time dateTime={updated}>{formatDate(updated)}</time>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        {/* 3. The product: a real page, with its footnotes. */}
        {place && (
          <section aria-labelledby="record-heading" className="border-b border-line">
            <div className="mx-auto grid max-w-[75rem] gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:px-8 lg:py-28">
              <div className="lg:pt-6">
                <p className="kicker text-accent">Your representatives</p>
                <h2 id="record-heading" className="mt-4 text-[2rem] leading-[1.08] font-bold tracking-[-0.03em] text-balance sm:text-[2.75rem]">
                  One PIN code. Your MP, your MLA, and the footnotes.
                </h2>
                <p className="mt-5 text-[1.0625rem] leading-relaxed text-muted">
                  This is the real page for PIN code <span className="font-mono text-[0.9375rem] text-foreground">{place.pin}</span>,{" "}
                  {place.area}. Scroll it: every fact carries a numbered source, like a footnote, and a date.
                </p>
                <ol className="mt-8 space-y-5 border-t border-line pt-6">
                  {[
                    ["Who sits for you", "The MP for your Lok Sabha seat and the MLA for your assembly seat, with when and how each was elected."],
                    ["What they do in office", "Questions asked, attendance and the local area fund, each beside the average for all MPs. Never a score."],
                    ["Where it came from", "The Lok Sabha, the Election Commission and the MPLADS dashboard, linked and dated."],
                  ].map(([title, text], i) => (
                    <li key={title} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3">
                      <span className="font-mono text-sm font-medium text-accent tabular-nums">[{i + 1}]</span>
                      <div>
                        <h3 className="font-bold">{title}</h3>
                        <p className="mt-1 text-[0.9375rem] text-muted">{text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <Link href={`/pin/${place.pin}`} className="btn btn-primary btn-lg mt-9">
                  Open the {place.area} page
                  <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={2.25} />
                </Link>
              </div>
              <BrowserFrame path={`/pin/${place.pin}`} label={`Live preview of the page for PIN code ${place.pin}`}>
                <div className="bg-background px-5 pt-6 pb-8 sm:px-7">
                  <p className="eyebrow">
                    PIN code <span className="font-mono">{place.pin}</span>
                  </p>
                  <p className="mt-1 text-[1.75rem] leading-tight font-bold tracking-[-0.015em]">{place.area}</p>
                  <p className="mt-1 text-[0.9375rem] text-muted">
                    {place.district} district, {place.state}
                  </p>
                  <div className="mt-6 grid gap-5">
                    {place.seats.map((seat) => (
                      <RepresentativeCard key={seat.id} seat={seat} notes={notes} />
                    ))}
                  </div>
                  <SourceList sources={notes.all} />
                </div>
              </BrowserFrame>
            </div>
          </section>
        )}

        {/* 4. Know your rights: everyday situations, each with the section that answers it. */}
        <section id="rights" aria-labelledby="rights-heading" className="border-b border-line">
          <div className="mx-auto max-w-[75rem] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-16">
              <div>
                <p className="kicker text-accent">Know your rights</p>
                <h2 id="rights-heading" className="mt-4 text-[2rem] leading-[1.08] font-bold tracking-[-0.03em] text-balance sm:text-[2.75rem]">
                  The law, in the words you&apos;d use to describe the problem.
                </h2>
                <p className="mt-5 max-w-[38rem] text-[1.0625rem] leading-relaxed text-muted">
                  {number.format(sections)} sections of the Constitution and seven Acts, each summarised in plain words
                  and linked to the official text. Describe what happened; the search finds the section.
                </p>
              </div>
              <div className="border-t-2 border-foreground pt-5">
                <LawSearchForm label="Describe your problem" />
              </div>
            </div>

            {situations.length > 0 && (
              <div className="mt-14 grid gap-px overflow-hidden border-y-2 border-foreground bg-line lg:mt-16 lg:grid-cols-2">
                {situations.map((s, i) => (
                  <article
                    key={s.number + s.act.id}
                    className={`flex flex-col ${i === 0 ? "bg-accent-soft px-5 py-9 sm:px-8 sm:py-10 lg:row-span-3 lg:px-12 lg:py-14" : "bg-background py-9 sm:py-10 lg:px-10"}`}
                  >
                    <p className="kicker text-muted">
                      {s.act.short_name} · {s.act.unit} {s.section.number}
                    </p>
                    <h3
                      className={`mt-4 font-bold tracking-[-0.025em] text-balance ${i === 0 ? "text-[2rem] leading-[1.05] sm:text-[2.75rem] lg:text-[3.25rem]" : "text-[1.5rem] leading-[1.15] sm:text-[1.75rem]"}`}
                    >
                      &ldquo;{s.says}&rdquo;
                      <span className="mt-1 block text-accent">{s.ask}</span>
                    </h3>
                    <p className={`mt-4 leading-relaxed ${i === 0 ? "text-[1.0625rem] sm:text-lg" : "text-base text-muted"}`}>
                      {s.section.summary}
                    </p>
                    <p className="mt-5">
                      <Link href={`/laws/${s.act.id}#${s.section.anchor}`} className="link">
                        Read {s.act.unit.toLowerCase()} {s.section.number} of the {s.act.short_name}
                        <ArrowRight aria-hidden className="ml-1.5 inline-block h-4 w-4 align-[-0.15em]" />
                      </Link>
                    </p>
                    {i === 0 && arrestSample && (
                      <figure className="mt-10 rounded-lg border border-teal-700/25 bg-background/70 p-5">
                        <figcaption className="kicker text-muted">Asked the rights assistant · sample</figcaption>
                        <blockquote className="mt-3 text-[1.0625rem] leading-snug font-medium">
                          &ldquo;{arrestSample.question}&rdquo;
                        </blockquote>
                        <Link href={`/assistant?sample=${arrestSample.id}`} className="link mt-3 inline-block text-[0.9375rem]">
                          Watch it answer, step by step
                          <ArrowRight aria-hidden className="ml-1.5 inline-block h-4 w-4 align-[-0.15em]" />
                        </Link>
                      </figure>
                    )}
                    {i === 0 && arrestRights.length > 0 && (
                      <div className="mt-auto pt-10">
                        <h4 className="kicker border-b border-foreground/25 pb-2.5 text-muted">Also when you are arrested</h4>
                        <ul>
                          {arrestRights.map((x) => (
                            <li key={x.anchor} className="border-b border-foreground/15">
                              <Link
                                href={`/laws/bnss-2023#${x.anchor}`}
                                className="group grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 py-3 text-[0.9375rem]"
                              >
                                <span className="font-mono text-[0.8125rem] leading-6 text-accent">s. {x.number}</span>
                                <span className="font-medium group-hover:text-accent group-hover:underline">{x.title}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}

            <div className="mt-10 grid gap-6 text-[0.9375rem] sm:grid-cols-2 lg:grid-cols-3">
              <p>
                <Link href="/assistant" className="link font-semibold">
                  Ask the rights assistant
                </Link>
                <span className="text-muted">
                  {" "}
                  in your own words. It searches the law and cites each section it read. The AI is switched off for now,
                  so it answers five sample questions.
                </span>
              </p>
              <p>
                <Link href="/laws/old-to-new" className="link font-semibold">
                  Old to new sections
                </Link>
                <span className="text-muted"> turns &ldquo;IPC 420&rdquo; into &ldquo;BNS 318(4)&rdquo;, from the official correspondence tables.</span>
              </p>
              <p>
                <Link href="/laws" className="link font-semibold">
                  The law library
                </Link>
                <span className="text-muted">: {acts.map((a) => a.short_name).join(", ")}.</span>
              </p>
            </div>
          </div>
        </section>

        {/* 5. Take action: the RTI drafter's real output. */}
        <section id="letters" aria-labelledby="letters-heading" className="border-b border-line bg-sunken">
          <div className="mx-auto grid max-w-[75rem] gap-14 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-center lg:gap-20 lg:px-8 lg:py-28">
            <div className="order-2 pr-3 sm:pr-5 lg:order-1">
              <LetterSample english={buildLetter(SAMPLE_RTI)} hindi={buildLetter({ ...SAMPLE_RTI, language: "hi" })} />
            </div>
            <div className="order-1 lg:order-2">
              <p className="kicker text-accent">Take action</p>
              <h2 id="letters-heading" className="mt-4 text-[2rem] leading-[1.08] font-bold tracking-[-0.03em] text-balance sm:text-[2.75rem]">
                Ask the government. In writing, in English or Hindi.
              </h2>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-muted">
                Answer a few questions and get a letter that cites the right sections, ready to print and send. The RTI
                drafter fills in your state&apos;s fee and portal: Rs. {RTI_RULES.central.fee} for central offices, Rs.{" "}
                {RTI_RULES.gujarat.fee} in Gujarat. Nothing you type leaves your browser.
              </p>
              <ul className="mt-8 border-t border-line">
                {[
                  ["/rti", "RTI application", "under section 6 of the RTI Act"],
                  ["/rti/appeal", "First appeal", "when 30 days pass with no reply"],
                  ["/letters/consumer", "Consumer complaint", "to the seller, then the Commission"],
                  ["/letters/police", "Police won’t register an FIR", "a complaint to the SP"],
                ].map(([href, label, note]) => (
                  <li key={href} className="border-b border-line">
                    <Link href={href} className="group flex items-baseline justify-between gap-4 py-3.5">
                      <span>
                        <span className="font-semibold text-accent group-hover:underline">{label}</span>
                        <span className="text-[0.9375rem] text-muted"> · {note}</span>
                      </span>
                      <ArrowRight aria-hidden className="h-4 w-4 shrink-0 translate-y-0.5 text-accent" />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href={SAMPLE_RTI_LINK} className="btn btn-primary btn-lg mt-8">
                Draft an RTI application
                <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={2.25} />
              </Link>
            </div>
          </div>
        </section>

        {/* 6. How we stay neutral and sourced. */}
        <section id="neutral" aria-labelledby="neutral-heading" className="border-b border-line">
          <div className="mx-auto grid max-w-[75rem] gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:px-8 lg:py-28">
            <div>
              <p className="kicker text-accent">How we work</p>
              <h2 id="neutral-heading" className="mt-4 text-[2rem] leading-[1.08] font-bold tracking-[-0.03em] text-balance sm:text-[2.75rem]">
                No ratings. No party colours. A source for every fact.
              </h2>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-muted">
                CivicLens is an independent project, not a government website, and it doesn&apos;t give legal advice.
                These rules are checked in the data and the tests, not just promised here.
              </p>
              {demo && (
                <figure className="mt-10 border-t-2 border-foreground pt-4">
                  <figcaption className="kicker">The rights assistant, counted</figcaption>
                  <dl className="mt-4 grid grid-cols-3 gap-4">
                    {[
                      [number.format(demo.answered), "sample answers"],
                      [number.format(demo.citations), "citations checked"],
                      [number.format(demo.dropped), "removed as unread"],
                    ].map(([value, label]) => (
                      <div key={label} className="flex flex-col">
                        <dt className="text-sm text-muted">{label}</dt>
                        <dd className="order-first text-[2rem] leading-none font-bold tracking-[-0.03em] tabular-nums">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-4 text-sm text-muted">
                    Demo mode{demo.first_run && <>, counted since {formatDate(demo.first_run)}</>}.{" "}
                    {live && live.runs === 0 ? "Live AI answers: none yet, because the AI is switched off. " : ""}
                    <Link href="/accuracy" className="link">
                      See the accuracy page
                    </Link>
                    .
                  </p>
                </figure>
              )}
            </div>
            <ul className="border-t-2 border-foreground">
              {RULES.map(([rule, detail]) => (
                <li key={rule} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3 border-b border-line py-5 sm:grid-cols-[1.75rem_15rem_minmax(0,1fr)] sm:gap-x-5">
                  <Check aria-hidden className="mt-0.5 h-5 w-5 text-accent" strokeWidth={2.5} />
                  <p className="font-bold">{rule}</p>
                  <p className="col-start-2 mt-1 text-[0.9375rem] text-muted sm:col-start-3 sm:mt-0">{detail}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 7. Open data and sources: the appendix. */}
        <section id="data" aria-labelledby="data-heading" className="border-b border-line">
          <div className="mx-auto max-w-[75rem] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
              <div>
                <p className="kicker text-accent">Open data</p>
                <h2 id="data-heading" className="mt-4 text-[2rem] leading-[1.08] font-bold tracking-[-0.03em] text-balance sm:text-[2.75rem]">
                  Take the data with you.
                </h2>
              </div>
              <p className="text-[1.0625rem] leading-relaxed text-muted lg:pt-10">
                Every table the site shows downloads as CSV, each row with the official source it came from. Next on the
                list: every PIN code in India, and every state assembly seat and MLA.
              </p>
            </div>

            {datasets.length > 0 && (
              <div className="mt-10 overflow-x-auto">
                <table className="w-full min-w-[20rem] text-left text-[0.9375rem]">
                  <caption className="sr-only">Datasets you can download</caption>
                  <thead>
                    <tr className="border-b-2 border-foreground">
                      <th scope="col" className="kicker py-3 pr-4 font-medium">Dataset</th>
                      <th scope="col" className="kicker py-3 pr-4 text-right font-medium">Rows</th>
                      <th scope="col" className="kicker hidden py-3 pr-4 text-right font-medium sm:table-cell">Columns</th>
                      <th scope="col" className="kicker py-3 text-right font-medium">
                        <span className="sr-only">Download</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasets.map((d) => (
                      <tr key={d.id} className="border-b border-line align-baseline">
                        <th scope="row" className="py-4 pr-4 font-semibold">
                          {d.title}
                          <span className="mt-0.5 hidden max-w-[44rem] text-sm font-normal text-muted md:block">
                            {d.description.split(". ")[0].replace(/\.$/, "")}.
                          </span>
                        </th>
                        <td className="py-4 pr-4 text-right font-mono tabular-nums">{number.format(d.rows)}</td>
                        <td className="hidden py-4 pr-4 text-right font-mono tabular-nums sm:table-cell">{d.columns.length}</td>
                        <td className="py-4 text-right">
                          <a href={`/data/${d.id}.csv`} download className="link inline-flex items-center gap-1.5 whitespace-nowrap">
                            <Download aria-hidden className="h-4 w-4" />
                            CSV<span className="sr-only">: {d.title}</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {publishers.length > 0 && (
              <div id="sources" className="mt-16">
                <h3 className="kicker border-b-2 border-foreground pb-3">
                  Where the data comes from · {sources.length} official records from {publishers.length} publishers
                </h3>
                <div className="mt-2 grid gap-x-12 md:grid-cols-2">
                  {publishers.map(([publisher, list]) => (
                    <details key={publisher} className="group border-b border-line">
                      <summary className="flex min-h-12 cursor-pointer list-none items-baseline justify-between gap-4 py-3 [&::-webkit-details-marker]:hidden">
                        <span className="font-semibold">{publisher}</span>
                        <span className="shrink-0 font-mono text-sm text-muted tabular-nums">
                          {list.length} {list.length === 1 ? "record" : "records"}
                        </span>
                      </summary>
                      <ul className="space-y-2.5 pb-4 text-sm">
                        {list.map((s) => (
                          <li key={s.id}>
                            <a href={s.url} className="link inline-flex items-start gap-1" target="_blank" rel="noopener noreferrer">
                              {s.title}
                              <ArrowUpRight aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            </a>
                            {s.published_on && <span className="text-muted"> · published {formatDate(s.published_on)}</span>}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 8. The last word: back to the search. */}
        <section aria-labelledby="cta-heading" className="relative overflow-hidden bg-teal-800 text-white">
          <div className="mx-auto flex max-w-[75rem] flex-col gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-24">
            <div>
              <h2 id="cta-heading" className="text-[2.25rem] leading-[1.02] font-bold tracking-[-0.04em] text-balance sm:text-[3.5rem]">
                {number.format(seats || 543)} seats. Find yours.
              </h2>
              <p className="mt-4 max-w-[34rem] text-[1.0625rem] text-white/85">
                Free, no sign-up, and it works on any phone. Start with a PIN code or the name of your constituency.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/services" className="btn btn-lg bg-white text-teal-900 hover:bg-teal-50">
                Open the app
                <ArrowRight aria-hidden className="h-4 w-4" strokeWidth={2.25} />
              </Link>
              <Link href="/seats" className="btn btn-lg border-white/60 text-white hover:bg-white/10">
                Browse every seat
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter wide />
    </>
  );
}
