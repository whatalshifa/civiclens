import type { Metadata } from "next";
import Link from "next/link";

import { api } from "@/lib/api";
import type { Dataset } from "@/lib/types";

export const metadata: Metadata = {
  title: "Open data",
  description:
    "Download everything CivicLens shows as CSV: seats and representatives, MPs' records, the law library, the old-to-new section table and PIN codes. Each row names its official source.",
};

const number = new Intl.NumberFormat("en-IN");

export default async function DataPage() {
  const datasets = await api<Dataset[]>("/api/data");
  return (
    <div className="max-w-3xl">
      <p className="eyebrow">Open data</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">Download the data</h1>
      <p className="mt-4 text-muted">
        Everything CivicLens shows, as spreadsheets you can open in Excel or Google Sheets. They are the same tables the
        pages read, refreshed every week. Every row links to the official source it came from.
      </p>

      <ul className="mt-8 grid gap-4">
        {datasets.map((d) => (
          <li key={d.id} className="card p-5 sm:p-6">
            <h2 className="text-lg font-semibold">{d.title}</h2>
            <p className="mt-2 text-sm text-muted">{d.description}</p>
            <p className="mt-3 text-sm">
              {number.format(d.rows)} rows. Columns:{" "}
              <span className="break-words text-muted">{d.columns.join(", ")}</span>
            </p>
            <a
              href={`/data/${d.id}.csv`}
              className="btn btn-primary mt-4"
              aria-label={`Download CSV: ${d.title}`}
              download
            >
              Download CSV
            </a>
          </li>
        ))}
      </ul>

      <section aria-labelledby="reuse-heading" className="mt-10">
        <h2 id="reuse-heading" className="text-xl font-semibold">
          Using the data
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
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
            Spotted a mistake? See{" "}
            <Link href="/about" className="link">
              About
            </Link>{" "}
            for how to report it.
          </li>
        </ul>
      </section>
    </div>
  );
}
