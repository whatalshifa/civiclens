import type { Metadata } from "next";
import Link from "next/link";

import { IconDown, IconDownload } from "@/components/icons";
import { api } from "@/lib/api";
import type { Dataset } from "@/lib/types";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Open data",
  description:
    "Download everything CivicLens shows as CSV: seats and representatives, MPs' records, the law library, the old-to-new section table and PIN codes. Each row names its official source.",
  path: "/data",
});

const number = new Intl.NumberFormat("en-IN");

export default async function DataPage() {
  const datasets = await api<Dataset[]>("/api/data");
  return (
    <div className="max-w-3xl">
      <h1 className="page-title">Download the data</h1>
      <p className="lede">
        Everything CivicLens shows, as spreadsheets you can open in Excel or Google Sheets. They are the same tables the
        pages read, refreshed every week. Every row links to the official source it came from.
      </p>

      <ul className="mt-8 border-t border-line">
        {datasets.map((d) => (
          <li key={d.id} className="grid gap-3 border-b border-line py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-8">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">{d.title}</h2>
              <p className="mt-1 text-[0.9375rem] leading-snug text-muted">{d.description}</p>
              <p className="mt-2 text-sm leading-snug text-muted">
                <span className="font-medium text-foreground tabular-nums">{number.format(d.rows)}</span> rows. Columns:{" "}
                <span className="break-words">{d.columns.join(", ")}</span>
              </p>
            </div>
            <a
              href={`/data/${d.id}.csv`}
              className="btn btn-secondary self-start"
              aria-label={`Download CSV: ${d.title}`}
              download
            >
              <IconDownload className="h-4 w-4" />
              Download CSV
            </a>
          </li>
        ))}
      </ul>

      <details className="group mt-8 border-2 border-rule bg-surface">
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2.5 px-4 py-2.5 hover:bg-sunken [&::-webkit-details-marker]:hidden">
          <IconDown className="h-3.5 w-3.5 shrink-0 text-accent transition-transform group-open:rotate-180" />
          <h2 id="reuse-heading" className="text-lg font-semibold">
            Using the data
          </h2>
        </summary>
        <ul className="mx-4 mb-5 list-disc space-y-2 pl-5 text-muted marker:text-muted">
          <li>
            You&apos;re welcome to reuse it. Please credit CivicLens and the official source named in each row, which is
            where the facts come from.
          </li>
          <li>
            The law summaries are CivicLens&apos;s own plain-language explanations, not the law. Rely on the official
            text linked in the source column.
          </li>
          <li>
            The numbers are for information, not a ranking: compare an MP with the average for context, as the pages do.
          </li>
          <li>
            Spotted a mistake?{" "}
            <Link href="/#neutral" className="link">
              Corrections happen in the open
            </Link>
            : report it on GitHub and we&apos;ll check it against the official record.
          </li>
        </ul>
      </details>
    </div>
  );
}
