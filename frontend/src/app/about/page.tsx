import type { Metadata } from "next";
import Link from "next/link";

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
  [
    "Dated facts.",
    "Offices and positions change, so each one says when it was true and when the record was published.",
  ],
  ["Corrections in the open.", "Anyone can report a mistake on GitHub, and every change to the data is public there."],
];

export default async function AboutPage() {
  const sources = await api<Source[]>("/api/sources").catch(() => []);
  return (
    <div className="max-w-3xl">
      <p className="eyebrow">About</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">How CivicLens works</h1>
      <p className="prose-civic mt-4 text-muted">
        CivicLens helps people in India find out who represents them and what the law says about their rights. It is an
        independent student project, not a government website, and it doesn&apos;t give legal advice.
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
      <ul className="prose-civic mt-3 list-disc space-y-1 pl-5 text-muted">
        <li>
          Every Lok Sabha seat and its sitting MP, from the Lok Sabha&apos;s own member list. A scheduled job checks
          that list every week and proposes any change for a person to review before it goes live.
        </li>
        <li>
          A hand-checked sample of PIN codes and state assembly seats. More PIN codes are placed in seats by where their
          post offices are, which is close but not official, so pages say when a PIN code spans two seats.
        </li>
        <li>
          Plain-language summaries of key sections of the Constitution and seven Acts, including the new criminal laws
          (BNS, BNSS and BSA), with a lookup from old IPC and CrPC numbers to new ones. The summaries are ours: they
          simplify, so always check the official text before relying on one.
        </li>
        <li>
          A rights assistant that looks up the law and cites every section it uses, with every citation checked before
          you see it (
          <Link href="/accuracy" className="link">
            the count is public
          </Link>
          ), and an RTI application drafter.
        </li>
      </ul>
      <h2 className="mt-8 text-xl font-semibold">What&apos;s coming</h2>
      <ul className="prose-civic mt-3 list-disc space-y-1 pl-5 text-muted">
        <li>Every PIN code in India, and every state assembly seat and MLA.</li>
        <li>Representatives&apos; records: attendance, questions asked and declared affidavits.</li>
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
