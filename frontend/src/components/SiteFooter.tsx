import Link from "next/link";

import { IconDownload, IconOut } from "@/components/icons";
import { Seal } from "@/components/Logo";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Dataset, Source } from "@/lib/types";

const number = new Intl.NumberFormat("en-IN");

const FOOTER: { heading: string; links: { href: string; label: string }[] }[] = [
  {
    heading: "Your representatives",
    links: [
      { href: "/services", label: "Find your MP and MLA" },
      { href: "/seats", label: "Every Lok Sabha seat" },
    ],
  },
  {
    heading: "Know your rights",
    links: [
      { href: "/laws", label: "Law library" },
      { href: "/laws/old-to-new", label: "Old to new sections" },
      { href: "/assistant", label: "Rights assistant" },
    ],
  },
  {
    heading: "Take action",
    links: [
      { href: "/rti", label: "RTI application" },
      { href: "/letters", label: "Letters" },
    ],
  },
  {
    heading: "About and data",
    links: [
      { href: "/", label: "About CivicLens" },
      { href: "/data", label: "Open data" },
      { href: "/accuracy", label: "Accuracy" },
      { href: "/#sources", label: "Sources" },
    ],
  },
];

/**
 * The footer of a data portal, under the landing page and every page of the service: the site's
 * sections, then the datasets with their row counts, the publishers the data comes from, when the
 * record was last updated and the licence, each block under a heavy rule.
 */
export async function SiteFooter() {
  const [datasets, sources] = await Promise.all([
    api<Dataset[]>("/api/data").catch(() => [] as Dataset[]),
    api<Source[]>("/api/sources").catch(() => [] as Source[]),
  ]);
  const updated = sources
    .map((s) => s.published_on)
    .filter((d): d is string => !!d)
    .sort()
    .at(-1);
  const publishers = Object.entries(
    sources.reduce<Record<string, number>>((acc, s) => {
      const name = s.publisher.replace(/ \(.*\)$/, "");
      acc[name] = (acc[name] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <footer className="border-t-[6px] border-rule bg-sunken print:hidden">
      <div className="mx-auto max-w-6xl px-4 pt-8 pb-10 sm:px-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
          {FOOTER.map((column) => (
            <div key={column.heading} className="border-t-4 border-rule pt-3">
              <h2 className="caps text-[0.9375rem]">{column.heading}</h2>
              <ul className="mt-2.5 space-y-1.5 text-[0.9375rem]">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-foreground underline decoration-1 underline-offset-[3px] hover:text-accent hover:decoration-2">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-x-6 gap-y-8 lg:grid-cols-4">
          {datasets.length > 0 && (
            <div className="border-t-4 border-rule pt-3 lg:col-span-2">
              <h2 className="caps flex items-baseline justify-between gap-4 text-[0.9375rem]">
                Datasets
                <span className="font-mono text-[0.75rem] font-medium tracking-normal normal-case text-muted">CSV, every row sourced</span>
              </h2>
              <ul className="mt-2 text-[0.9375rem]">
                {datasets.map((d) => (
                  <li key={d.id} className="border-b border-line last:border-b-0">
                    <a href={`/data/${d.id}.csv`} download className="group flex items-baseline justify-between gap-4 py-1.5">
                      <span className="flex items-baseline gap-2">
                        <IconDownload className="h-3.5 w-3.5 shrink-0 translate-y-0.5 text-accent" />
                        <span className="underline decoration-1 underline-offset-[3px] group-hover:text-accent group-hover:decoration-2">
                          {d.title}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-[0.8125rem] text-muted tabular-nums">{number.format(d.rows)} rows</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {publishers.length > 0 && (
            <div className="border-t-4 border-rule pt-3">
              <h2 className="caps text-[0.9375rem]">Sources</h2>
              <ul className="mt-2 text-[0.875rem]">
                {publishers.map(([name, count]) => (
                  <li key={name} className="flex items-baseline justify-between gap-3 border-b border-line py-1.5 last:border-b-0">
                    <span>{name}</span>
                    <span className="shrink-0 font-mono text-[0.8125rem] text-muted tabular-nums">{count}</span>
                  </li>
                ))}
              </ul>
              <Link href="/#sources" className="link mt-2 inline-block text-sm">
                Every source, with links
              </Link>
            </div>
          )}

          <div className="border-t-4 border-rule pt-3">
            <h2 className="caps text-[0.9375rem]">Record</h2>
            <dl className="mt-2 text-[0.875rem]">
              {updated && (
                <div className="flex items-baseline justify-between gap-3 border-b border-line py-1.5">
                  <dt className="text-muted">Last updated</dt>
                  <dd className="font-mono text-[0.8125rem] font-semibold">
                    <time dateTime={updated}>{formatDate(updated)}</time>
                  </dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-3 border-b border-line py-1.5">
                <dt className="text-muted">Checked</dt>
                <dd className="font-semibold">Weekly</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-b border-line py-1.5">
                <dt className="text-muted">Data licence</dt>
                <dd className="text-right font-semibold">Its sources&apos; terms</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 py-1.5">
                <dt className="text-muted">Code licence</dt>
                <dd className="font-semibold">MIT</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-header text-header-ink">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
          <Seal className="h-24 w-24 shrink-0 text-header-ink" knockout="var(--header)" />
          <p className="max-w-3xl text-sm text-header-muted">
            CivicLens is an independent project, not a government website, and does not give legal advice. Every fact
            links to its official source; please check there before relying on it. Data is released under its
            sources&apos; terms; code under the MIT licence.
          </p>
          <a
            href="https://github.com/whatalshifa/civiclens"
            className="caps inline-flex shrink-0 items-center gap-1.5 text-[0.875rem] text-header-ink underline underline-offset-4 hover:text-signal focus-visible:outline-header-ink sm:ml-auto"
          >
            Source code on GitHub
            <IconOut className="h-3 w-3 text-signal" />
          </a>
        </div>
      </div>
    </footer>
  );
}
