import type { Metadata } from "next";

import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Source } from "@/lib/types";

export const metadata: Metadata = {
  title: "How CivicLens works",
  description: "How CivicLens stays nonpartisan, where its data comes from, and what it can and can't tell you.",
};

const RULES = [
  ["Every fact has a source.", "If we can't point to an official record for something, we don't show it."],
  [
    "Same treatment for everyone.",
    "Every representative gets the same fields in the same order. Seats are sorted by place, never by party.",
  ],
  ["No opinions, ratings or rankings.", "We show records. Judging them is up to you."],
  ["No party colours or symbols.", "Party names are plain text. Our own colour, teal, belongs to no major party."],
  ["Dated facts.", "Offices and positions change, so each one says when it was true and when the record was published."],
  ["Corrections in the open.", "Anyone can report a mistake on GitHub, and every change to the data is public there."],
];

export default async function AboutPage() {
  const sources = await api<Source[]>("/api/sources").catch(() => []);
  return (
    <div className="max-w-3xl">
      <p className="eyebrow">About</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">How CivicLens works</h1>
      <p className="prose-civic mt-4 text-muted">
        CivicLens helps people in India find out who represents them and what the law says about their rights. It is
        an independent student project, not a government website, and it doesn&apos;t give legal advice.
      </p>

      <h2 className="mt-10 text-xl font-semibold">How we stay nonpartisan</h2>
      <ul className="mt-4 space-y-3">
        {RULES.map(([rule, detail]) => (
          <li key={rule} className="card p-4">
            <p className="font-semibold">{rule}</p>
            <p className="mt-1 text-sm text-muted">{detail}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-xl font-semibold">What&apos;s here now</h2>
      <p className="prose-civic mt-3 text-muted">
        A hand-checked sample of PIN codes, seats and representatives across several states, and plain-language
        summaries of key sections of the Constitution and five Acts. The summaries are ours: they simplify, so always
        check the official text before relying on one.
      </p>
      <h2 className="mt-8 text-xl font-semibold">What&apos;s coming</h2>
      <ul className="prose-civic mt-3 list-disc space-y-1 pl-5 text-muted">
        <li>Every PIN code and seat in India, kept up to date automatically from official records.</li>
        <li>Representatives&apos; records: attendance, questions asked and declared affidavits.</li>
        <li>A rights assistant that answers questions by looking up the law, citing every section it uses.</li>
        <li>Help drafting RTI applications and complaints.</li>
      </ul>

      <h2 id="sources" className="mt-10 text-xl font-semibold">
        Where our data comes from
      </h2>
      <ul className="mt-4 space-y-3 text-sm">
        {sources.map((s) => (
          <li key={s.id}>
            <a href={s.url} className="link" target="_blank" rel="noopener noreferrer">
              {s.title}
            </a>
            <p className="text-muted">
              {s.publisher}
              {s.published_on && <> · published {formatDate(s.published_on)}</>}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
