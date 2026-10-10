import type { Source } from "@/lib/types";
import { formatDate } from "@/lib/format";

/**
 * Numbers sources in the order a page first cites them, like footnotes. Each fact on the page
 * shows its number; the list at the bottom says what each number is and links to it.
 */
export class SourceNotes {
  private order: Source[] = [];

  cite(source: Source): number {
    const at = this.order.findIndex((s) => s.id === source.id);
    if (at >= 0) return at + 1;
    this.order.push(source);
    return this.order.length;
  }

  get all(): Source[] {
    return this.order;
  }
}

export function Ref({ n, source }: { n: number; source: Source }) {
  return (
    <a href={`#source-${n}`} className="ref" aria-label={`Source ${n}: ${source.title}`} title={source.title}>
      [{n}]
    </a>
  );
}

export function SourceList({ sources, heading = "Sources" }: { sources: Source[]; heading?: string }) {
  return (
    <section aria-labelledby="sources-heading" className="mt-16 border-t border-line pt-8">
      <h2 id="sources-heading" className="text-lg font-semibold">
        {heading}
      </h2>
      <ol className="mt-4 max-w-3xl space-y-3 text-sm leading-snug">
        {sources.map((s, i) => (
          <li key={s.id} id={`source-${i + 1}`} className="flex gap-3">
            <span className="w-6 shrink-0 text-right text-muted tabular-nums">{i + 1}.</span>
            <div>
              <a href={s.url} className="link" target="_blank" rel="noopener noreferrer">
                {s.title}
              </a>
              <p className="mt-0.5 text-[0.8125rem] text-muted">
                {s.publisher}
                {s.published_on && <> · published {formatDate(s.published_on)}</>}
              </p>
              {s.note && <p className="text-[0.8125rem] text-muted">{s.note}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
