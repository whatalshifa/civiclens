import type { Metadata } from "next";
import Link from "next/link";

import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Accuracy, ModeStats } from "@/lib/types";

export const metadata: Metadata = {
  title: "How accurate is the assistant?",
  description:
    "Every citation the CivicLens rights assistant writes is checked against the sections it actually read. This page counts how many were kept and how many were removed.",
};

const number = new Intl.NumberFormat("en-IN");

const STEPS = [
  "The assistant searches the law library and reads the sections it needs, using the same tools you can use on this site.",
  "When it writes an answer, it cites each section it relies on.",
  "Before you see the answer, CivicLens checks every citation against the sections the assistant read in that run. Any citation to a section it didn't read is removed, and the answer says so.",
  "Each run is counted here: how many citations were kept and how many were removed. The questions themselves are never stored.",
];

export default async function AccuracyPage() {
  const { modes } = await api<Accuracy>("/api/accuracy", { cache: false });
  const live = modes.find((m) => m.mode === "ai")!;
  const demo = modes.find((m) => m.mode === "demo")!;

  return (
    <div className="max-w-3xl">
      <p className="eyebrow">Accuracy</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        How accurate is the rights assistant?
      </h1>
      <p className="mt-4 text-muted">
        AI assistants can cite laws that don&apos;t say what they claim, or don&apos;t exist. CivicLens checks every
        citation before you see it, and publishes the count here.
      </p>

      <section aria-labelledby="live-heading" className="mt-10">
        <h2 id="live-heading" className="text-xl font-semibold">
          Live answers
        </h2>
        {live.runs === 0 ? (
          <p className="mt-3 rounded-xl bg-sunken p-4 text-sm">
            None yet. The AI is switched off on this site for now, so the assistant answers only its prepared sample
            questions. These numbers will start counting when it is switched on.
          </p>
        ) : (
          <Stats stats={live} />
        )}
      </section>

      <section aria-labelledby="demo-heading" className="mt-10">
        <h2 id="demo-heading" className="text-xl font-semibold">
          Sample answers (demo)
        </h2>
        <p className="mt-1 text-sm text-muted">
          Prepared answers to five sample questions, replayed through the real search and reading tools each time
          someone opens one, and checked the same way. They were written in advance, so they show the check working, not
          how often a live AI gets it wrong.
        </p>
        <Stats stats={demo} />
      </section>

      <section aria-labelledby="how-heading" className="mt-12">
        <h2 id="how-heading" className="text-xl font-semibold">
          How the check works
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-muted marker:font-semibold marker:text-foreground">
          {STEPS.map((step) => (
            <li key={step} className="pl-1">
              {step}
            </li>
          ))}
        </ol>
        <p className="mt-5 text-sm text-muted">
          The check catches a citation to a section the assistant never read. It can&apos;t tell whether the assistant
          described a section it did read correctly, so every answer links to the sections it used, and each section
          links to the official text.{" "}
          <Link href="/assistant" className="link">
            Try the assistant
          </Link>
        </p>
      </section>
    </div>
  );
}

function Stats({ stats }: { stats: ModeStats }) {
  const total = stats.citations + stats.dropped;
  const items = [
    { label: "Answers", value: number.format(stats.answered) },
    { label: "Citations checked", value: number.format(total) },
    { label: "Removed as unread", value: number.format(stats.dropped) },
  ];
  return (
    <div className="mt-4">
      <dl className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.label} className="card p-4">
            <dt className="text-xs text-muted">{item.label}</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-muted">
        {stats.first_run ? `Counted since ${formatDate(stats.first_run)}.` : "Nothing counted yet."}
        {stats.failed > 0 &&
          ` ${number.format(stats.failed)} runs ended without an answer (an error, or the AI declined).`}
      </p>
    </div>
  );
}
