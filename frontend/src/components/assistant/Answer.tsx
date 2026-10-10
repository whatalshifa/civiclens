import Link from "next/link";
import type { ReactNode } from "react";

import { ACT_HELP, FreeHelp } from "@/components/FreeHelp";
import type { AnswerEvent, Citation } from "@/lib/types";

/**
 * Shows the assistant's answer. The answer is plain text with a little formatting ("- " bullets,
 * "1. " steps, **bold**) and {{cite:N}} where it cites a section. It is turned into elements
 * here rather than parsed as HTML, so nothing in an answer can inject markup into the page.
 */
export function Answer({ answer }: { answer: AnswerEvent }) {
  const blocks = answer.text.split(/\n\s*\n/).filter((b) => b.trim());
  return (
    <div>
      <div className="answer space-y-4 text-[1.0625rem] leading-relaxed">
        {blocks.map((block, i) => (
          <Block key={i} text={block} citations={answer.citations} />
        ))}
      </div>

      {answer.rti_link && (
        <div className="mt-6 flex flex-col gap-3 rounded-sm border border-teal-600/30 bg-accent-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            <span className="font-semibold">Your RTI application is ready to fill in.</span> Add your name and address,
            then print or download it.
          </p>
          <Link href={answer.rti_link} className="btn btn-primary shrink-0">
            Open the RTI application
          </Link>
        </div>
      )}

      {answer.citations.length > 0 && (
        <section className="mt-8" aria-labelledby="sections-used">
          <h3 id="sections-used" className="text-sm font-semibold">
            Sections this answer is based on
          </h3>
          <ol className="mt-3 space-y-2">
            {answer.citations.map((c, i) => (
              <li key={c.key} id={`cite-${i + 1}`} className="flex gap-3 text-sm">
                <span className="w-6 shrink-0 text-right font-semibold text-muted tabular-nums">{i + 1}.</span>
                <Link href={sectionHref(c)} className="link">
                  {c.act_short_name}, {c.unit} {c.number}: {c.title}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {answer.dropped > 0 && (
        <p className="mt-4 text-xs text-muted">
          We removed {answer.dropped === 1 ? "a citation" : `${answer.dropped} citations`} to{" "}
          {answer.dropped === 1 ? "a section" : "sections"} the assistant hadn&apos;t read, so every link above is one
          it checked.
        </p>
      )}

      <FreeHelp topics={[...new Set(answer.citations.flatMap((c) => ACT_HELP[c.act_id] ?? []))]} className="mt-8" />
    </div>
  );
}

export function sectionHref(c: Pick<Citation, "act_id" | "anchor">) {
  return `/laws/${c.act_id}#${c.anchor}`;
}

function Block({ text, citations }: { text: string; citations: Citation[] }) {
  const lines = text.split("\n").filter((l) => l.trim());
  const bullets = lines.every((l) => /^\s*[-•]\s+/.test(l));
  const numbered = lines.every((l) => /^\s*\d+[.)]\s+/.test(l));
  if (bullets || numbered) {
    const items = lines.map((l) => l.replace(/^\s*([-•]|\d+[.)])\s+/, ""));
    const ListTag = numbered ? "ol" : "ul";
    return (
      <ListTag className={`space-y-2 pl-6 ${numbered ? "list-decimal" : "list-disc"} marker:text-muted`}>
        {items.map((item, i) => (
          <li key={i} className="pl-1">
            <Inline text={item} citations={citations} />
          </li>
        ))}
      </ListTag>
    );
  }
  // A heading-like line ("What you can do:") followed by a list in the same block.
  const listStart = lines.findIndex((l) => /^\s*([-•]|\d+[.)])\s+/.test(l));
  if (listStart > 0) {
    return (
      <>
        <Block text={lines.slice(0, listStart).join("\n")} citations={citations} />
        <Block text={lines.slice(listStart).join("\n")} citations={citations} />
      </>
    );
  }
  const isLabel = lines.length === 1 && /:$/.test(lines[0]) && lines[0].length < 60;
  return (
    <p className={isLabel ? "-mb-2 font-semibold" : undefined}>
      <Inline text={lines.join(" ")} citations={citations} />
    </p>
  );
}

function Inline({ text, citations }: { text: string; citations: Citation[] }) {
  const out: ReactNode[] = [];
  // Split into **bold**, {{cite:N}} and plain text.
  const pattern = /\*\*(.+?)\*\*|\{\{cite:(\d+)\}\}/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) out.push(text.slice(last, match.index));
    if (match[1] !== undefined) {
      out.push(<strong key={match.index}>{match[1]}</strong>);
    } else {
      const n = Number(match[2]);
      const c = citations[n - 1];
      if (c) {
        out.push(
          <sup key={match.index} className="ml-0.5">
            <Link
              href={sectionHref(c)}
              className="cite"
              aria-label={`Source ${n}: ${c.act_short_name}, ${c.unit} ${c.number}`}
              title={`${c.act_short_name}, ${c.unit} ${c.number}: ${c.title}`}
            >
              {n}
            </Link>
          </sup>,
        );
      }
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}
