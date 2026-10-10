import { ChevronDown, Download } from "lucide-react";
import Link from "next/link";

import { PinForm } from "@/components/PinForm";
import { StateMap } from "@/components/StateMap";
import { api } from "@/lib/api";
import { formatDate, slugify } from "@/lib/format";
import type { ActBrief, Coverage, Dataset, Source, StateSeats } from "@/lib/types";

const number = new Intl.NumberFormat("en-IN");

type IndexLink = { href: string; label: string; note?: string };
type IndexSection = { id: string; title: string; href: string; summary: string; links: IndexLink[] };

/** The directory below the search: every service on the site, as plain link lists under four headings. */
function directory(acts: ActBrief[], seats: number, sections: number): IndexSection[] {
  return [
    {
      id: "representatives",
      title: "Your representatives",
      href: "/seats",
      summary: "Who sits for your area in the Lok Sabha and the state assembly, and their record in office.",
      links: [
        { href: "#find", label: "Find by PIN code or constituency" },
        { href: "/seats", label: `Browse all ${seats || 543} Lok Sabha seats`, note: "by state" },
        { href: "/seats/ls-kollam", label: "MPs' records: questions, attendance, MP fund", note: "example" },
        { href: "/pin/221001", label: "Ministers and office holders", note: "example" },
        { href: "/data/representatives.csv", label: "Seats and members", note: "CSV" },
      ],
    },
    {
      id: "rights",
      title: "Know your rights",
      href: "/laws",
      summary: `${sections} sections of the Constitution and seven Acts, each summarised in plain words.`,
      links: [
        { href: "/laws", label: "Law library A to Z", note: `${acts.length || 8} laws` },
        { href: "/laws#law-q", label: "Search the law in plain words" },
        ...acts
          .filter((a) => ["constitution", "rti-act-2005", "consumer-protection-act-2019"].includes(a.id))
          .map((a) => ({
            href: `/laws/${a.id}`,
            label: a.id === "constitution" ? "Fundamental rights (Constitution)" : a.title.replace(/,? \d{4}$/, ""),
          })),
        { href: "/laws/bns-2023", label: "New criminal laws: BNS, BNSS, BSA" },
        { href: "/laws/old-to-new", label: "Old to new criminal law lookup", note: "IPC to BNS" },
        { href: "/assistant", label: "Rights assistant", note: "ask in your own words" },
      ],
    },
    {
      id: "action",
      title: "Take action",
      href: "/letters",
      summary: "Ready-to-send letters in English or Hindi. Nothing you type leaves your browser.",
      links: [
        { href: "/rti", label: "Draft an RTI application" },
        { href: "/rti/appeal", label: "RTI first appeal", note: "when there is no reply" },
        { href: "/letters/consumer", label: "Consumer complaint" },
        { href: "/letters/police", label: "Police won't register an FIR" },
        { href: "/letters", label: "All letters" },
      ],
    },
    {
      id: "data",
      title: "Data and sources",
      href: "/data",
      summary: "Every table on this site, with the official record each row came from.",
      links: [
        { href: "/data", label: "Open data downloads", note: "CSV" },
        { href: "/about#sources", label: "Where the data comes from" },
        { href: "/accuracy", label: "Accuracy of the rights assistant" },
        { href: "/about", label: "How CivicLens stays nonpartisan" },
        { href: "https://github.com/whatalshifa/civiclens/issues", label: "Report a mistake" },
      ],
    },
  ];
}

const QUESTIONS = [
  "Police won't register my FIR",
  "How long does an RTI reply take?",
  "Shop refused to refund a defective product",
  "Free seats for children in private schools",
];

export default async function Home({ searchParams }: PageProps<"/">) {
  const { pin } = await searchParams;
  const [coverage, acts, states, sources, datasets] = await Promise.all([
    api<Coverage>("/api/coverage").catch(() => null),
    api<ActBrief[]>("/api/laws").catch(() => []),
    api<StateSeats[]>("/api/seats").catch(() => []),
    api<Source[]>("/api/sources").catch(() => []),
    api<Dataset[]>("/api/data").catch(() => []),
  ]);
  const seats = states.reduce((n, s) => n + s.seats.length, 0);
  const vacant = states.reduce((n, s) => n + s.seats.filter((x) => !x.member).length, 0);
  const sections = acts.reduce((n, a) => n + a.section_count, 0);
  const memberList = sources.find((s) => s.id === "lok-sabha-sitting-members");
  const updated = sources
    .map((s) => s.published_on)
    .filter((d): d is string => !!d)
    .sort()
    .at(-1);
  const index = directory(acts, seats, sections);
  const panel = (id: string) => (
    <DataPanel
      id={id}
      rows={[
        ["Lok Sabha seats", number.format(seats)],
        ["Sitting MPs listed", number.format(seats - vacant)],
        ["Vacant seats", number.format(vacant)],
        ["PIN codes checked", number.format(coverage?.pincodes ?? 0)],
        ["Law sections explained", number.format(sections)],
        ["Datasets to download", number.format(datasets.length)],
      ]}
      updated={updated}
      memberList={memberList}
    />
  );
  const byName = [...states].sort((a, b) => a.state.localeCompare(b.state));

  return (
    <div>
      {/* One job first: the lookup. Left-aligned in two thirds of the page, with the data panel beside it. */}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-12">
        <div id="find">
          <p className="text-base font-medium text-muted sm:text-lg">Representatives</p>
          <h1 className="mt-1 text-[2rem] leading-[1.1] font-bold tracking-[-0.02em] sm:text-5xl">
            Find your MP and MLA
          </h1>
          <p className="mt-4 max-w-[38rem] text-[1.0625rem] leading-relaxed sm:text-[1.1875rem]">
            See who represents your area in the Lok Sabha and in your state&apos;s Vidhan Sabha, with the official record
            behind every fact.
          </p>

          <div className="mt-7">
            <PinForm
              serverError={
                pin === "invalid" ? "Type a six-digit PIN code, like 110001, or a name, like Baramati." : undefined
              }
            />
          </div>

          {coverage && coverage.examples.length > 0 && (
            <div className="mt-5 text-[0.9375rem]">
              <p className="font-bold">Examples</p>
              <ul className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1.5">
                {coverage.examples.map((p) => (
                  <li key={p.pin}>
                    <Link href={`/pin/${p.pin}`} className="link whitespace-nowrap" title={p.area}>
                      <span className="font-mono text-[0.8125rem]">{p.pin}</span>{" "}
                      {p.area.replace(/ G\.P\.O\.$/, "").replace(/ \(.*\)$/, "")}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-7 max-w-[38rem] border-l-[6px] border-line py-1 pl-4 text-[0.9375rem]">
            Every Lok Sabha seat can be found by name. PIN codes cover a checked sample of{" "}
            <span className="tabular-nums">{coverage?.pincodes ?? 25}</span> areas so far.{" "}
            <Link href="/seats" className="link">
              Browse all seats by state
            </Link>
            .
          </div>
        </div>

        <div className="hidden lg:block">
          {panel("panel-wide")}
        </div>
      </div>

      {/* The directory, after a GOV.UK topic page: headings and plain link lists, no cards. */}
      <section aria-labelledby="services-heading" className="mt-14 border-t-2 border-foreground pt-6 sm:mt-16">
        <h2 id="services-heading" className="text-[1.5rem] font-bold tracking-[-0.01em] sm:text-[1.75rem]">
          Services and information
        </h2>

        <div className="mt-6 hidden gap-x-8 gap-y-10 md:grid md:grid-cols-2 lg:grid-cols-4">
          {index.map((section) => (
            <div key={section.id}>
              <h3 className="text-lg font-bold">
                <Link href={section.href} className="link">
                  {section.title}
                </Link>
              </h3>
              <p className="mt-1.5 text-sm text-muted">{section.summary}</p>
              <IndexList links={section.links} />
            </div>
          ))}
        </div>

        {/* On a phone the same index folds into sections, so the search stays the first thing. */}
        <div className="mt-4 border-b border-line md:hidden">
          {index.map((section) => (
            <details key={section.id} className="group border-t border-line">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-3 [&::-webkit-details-marker]:hidden">
                <span>
                  <span className="block text-lg leading-snug font-bold text-accent">{section.title}</span>
                  <span className="mt-0.5 block text-sm text-muted">{section.summary}</span>
                </span>
                <ChevronDown aria-hidden className="h-5 w-5 shrink-0 text-accent transition-transform group-open:rotate-180" />
              </summary>
              <div className="pb-4">
                <IndexList links={section.links} />
              </div>
            </details>
          ))}
        </div>

        <div className="mt-10 grid gap-x-8 gap-y-3 md:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] md:items-baseline">
          <h3 className="text-base font-bold">Common questions about your rights</h3>
          <ul className="flex flex-col gap-y-2 text-[0.9375rem] md:flex-row md:flex-wrap md:gap-x-6">
            {QUESTIONS.map((q) => (
              <li key={q}>
                <Link href={`/laws/search?q=${encodeURIComponent(q)}`} className="link">
                  {q}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mt-12 lg:hidden">
        {panel("panel-narrow")}
      </div>

      {states.length > 0 && (
        <section aria-labelledby="states-heading" className="mt-14 border-t-2 border-foreground pt-6 sm:mt-16">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 id="states-heading" className="text-[1.5rem] font-bold tracking-[-0.01em] sm:text-[1.75rem]">
              Lok Sabha seats by state
            </h2>
            <a href="/data/representatives.csv" download className="link inline-flex items-center gap-1.5 text-sm">
              <Download aria-hidden className="h-4 w-4" />
              Download as CSV
            </a>
          </div>
          <p className="mt-2 text-sm text-muted">
            <span className="tabular-nums">{seats}</span> seats in <span className="tabular-nums">{states.length}</span>{" "}
            states and union territories.
            {memberList && (
              <>
                {" "}
                Source:{" "}
                <a href={memberList.url} className="link" target="_blank" rel="noopener noreferrer">
                  {memberList.publisher}
                </a>
                {memberList.published_on && <>, as listed {formatDate(memberList.published_on)}</>}.
              </>
            )}
          </p>

          <div className="mt-6 grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-12">
            <div className="hidden lg:block">
              <StateMap states={states} />
            </div>
            <details className="group border-y border-line md:hidden">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between font-bold text-accent [&::-webkit-details-marker]:hidden">
                Show all {states.length} states
                <ChevronDown aria-hidden className="h-5 w-5 transition-transform group-open:rotate-180" />
              </summary>
              <StateTable states={byName} />
            </details>
            <div className="hidden md:block">
              <StateTable states={byName} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function IndexList({ links }: { links: IndexLink[] }) {
  return (
    <ul className="mt-3 space-y-2 text-[0.9375rem]">
      {links.map((link) => (
        <li key={link.href + link.label} className="leading-snug">
          {link.href.endsWith(".csv") ? (
            <a href={link.href} download className="link">
              {link.label}
            </a>
          ) : (
            <Link href={link.href} className="link">
              {link.label}
            </Link>
          )}
          {link.note && <span className="text-sm text-muted"> · {link.note}</span>}
        </li>
      ))}
    </ul>
  );
}

/** A data panel in the manner of an infobox: the numbers behind the service, when they were last checked. */
function DataPanel({
  id,
  rows,
  updated,
  memberList,
}: {
  id: string;
  rows: [string, string][];
  updated?: string;
  memberList?: Source;
}) {
  return (
    <aside aria-labelledby={id} className="self-start border-t-4 border-accent bg-sunken px-5 pt-4 pb-5">
      <h2 id={id} className="text-lg font-bold">
        About this data
      </h2>
      <dl className="mt-3 text-[0.9375rem]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 border-b border-line py-2">
            <dt className="text-muted">{label}</dt>
            <dd className="font-bold tabular-nums">{value}</dd>
          </div>
        ))}
        {updated && (
          <div className="flex items-baseline justify-between gap-4 py-2">
            <dt className="text-muted">Last updated</dt>
            <dd className="font-bold">
              <time dateTime={updated}>{formatDate(updated)}</time>
            </dd>
          </div>
        )}
      </dl>
      <p className="mt-3 text-sm text-muted">
        Seats and members from the{" "}
        {memberList ? (
          <a href={memberList.url} className="link" target="_blank" rel="noopener noreferrer">
            Lok Sabha&apos;s member list
          </a>
        ) : (
          "Lok Sabha's member list"
        )}
        , checked weekly. Results from the Election Commission; laws from India Code.
      </p>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link href="/data" className="link">
          Open data
        </Link>
        <Link href="/about#sources" className="link">
          All sources
        </Link>
      </p>
    </aside>
  );
}

/** Every state with its seat count, in newspaper columns, each opening that state on the seats page. */
function StateTable({ states }: { states: StateSeats[] }) {
  return (
    <table className="w-full text-[0.9375rem]">
      <caption className="sr-only">Lok Sabha seats in each state and union territory</caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">State or union territory</th>
          <th scope="col">Seats</th>
        </tr>
      </thead>
      <tbody className="block sm:columns-2 sm:gap-x-8 xl:columns-3">
        {states.map((s) => (
          <tr key={s.state} className="flex break-inside-avoid items-baseline gap-2 border-b border-line py-1.5">
            <th
              scope="row"
              className="flex min-w-0 flex-1 items-baseline gap-2 text-left font-normal after:mb-1 after:min-w-4 after:flex-1 after:self-end after:border-b after:border-dotted after:border-muted/50 after:content-['']"
            >
              <Link href={`/seats#${slugify(s.state)}`} className="link">
                {s.state}
              </Link>
            </th>
            <td className="font-bold tabular-nums">{s.seats.length}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
