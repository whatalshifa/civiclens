import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
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
      <h1 className="page-title">Laws that protect you, in plain words</h1>
      <p className="lede">
        Each section is summarised simply, with a link to the official text. Summaries help you find and understand
        the law; before relying on one, read the official wording.
      </p>
      <div className="mt-6 max-w-2xl">
        <LawSearchForm />
      </div>
      <p className="mt-4 text-[0.9375rem] text-muted">
        Have an old IPC or CrPC number, like “IPC 420”?{" "}
        <Link href="/laws/old-to-new" className="link">
          Find its new BNS or BNSS section
        </Link>
      </p>
      <ul className="mt-12 grid gap-5 md:grid-cols-2">
        {acts.map((act) => (
          <li key={act.id}>
            <Link href={`/laws/${act.id}`} className="card-link group flex h-full flex-col p-6">
              <p className="text-[0.8125rem] text-muted">{act.citation}</p>
              <h2 className="mt-1 text-lg font-semibold">{act.title}</h2>
              <p className="mt-2 mb-4 text-[0.9375rem] text-muted">{act.summary}</p>
              <p className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-accent">
                <span className="tabular-nums">{act.section_count}</span>{" "}
                {act.unit === "Article" ? "articles" : "sections"}
                <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
