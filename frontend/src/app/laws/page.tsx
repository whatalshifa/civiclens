import type { Metadata } from "next";
import Link from "next/link";

import { LawSearchForm } from "@/components/LawSearchForm";
import { api } from "@/lib/api";
import type { ActBrief } from "@/lib/types";

export const metadata: Metadata = {
  title: "Laws in plain language",
  description: "The Constitution, the RTI Act, consumer rights, arrest rights and more, explained simply with links to the official text.",
};

export default async function LawsPage() {
  const acts = await api<ActBrief[]>("/api/laws");
  return (
    <div>
      <p className="eyebrow">Law library</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Laws that protect you, in plain words</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Each section is summarised simply, with a link to the official text. Summaries help you find and understand
        the law; before relying on one, read the official wording.
      </p>
      <div className="mt-6 max-w-2xl">
        <LawSearchForm />
      </div>
      <p className="mt-4 text-sm">
        Have an old IPC or CrPC number, like “IPC 420”?{" "}
        <Link href="/laws/old-to-new" className="link font-medium">
          Find its new BNS or BNSS section
        </Link>
      </p>
      <ul className="mt-10 grid gap-4 md:grid-cols-2">
        {acts.map((act) => (
          <li key={act.id}>
            <Link href={`/laws/${act.id}`} className="card block h-full p-5 transition-colors hover:bg-sunken sm:p-6">
              <p className="text-xs text-muted">{act.citation}</p>
              <h2 className="mt-1 text-lg font-semibold">{act.title}</h2>
              <p className="mt-2 text-sm text-muted">{act.summary}</p>
              <p className="mt-3 text-sm font-medium text-accent">
                {act.section_count} {act.unit === "Article" ? "articles" : "sections"} →
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
