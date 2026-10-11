import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { IconLeft, IconOut, IconRight } from "@/components/icons";
import { ACT_HELP, FreeHelp } from "@/components/FreeHelp";
import { LawSearchForm } from "@/components/LawSearchForm";
import { PaneSwitcher } from "@/components/PaneSwitcher";
import { ApiError, api } from "@/lib/api";
import type { Act } from "@/lib/types";

async function getAct(id: string): Promise<Act | null> {
  try {
    return await api<Act>(`/api/laws/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps<"/laws/[act]">): Promise<Metadata> {
  const act = await getAct((await params).act).catch(() => null);
  return act ? { title: `${act.short_name} in plain language`, description: act.summary } : {};
}

/**
 * An act reads one section at a time, like a reader app: the contents down the side, one section
 * beside it with the previous and next ones linked under it. Each section is a pane picked by the
 * address (#s-173), so search results, citations and the old-to-new tables still land on the right
 * one. "Read all on one page" (?view=all) lays every section out in order, for reading straight
 * through or printing.
 */
export default async function ActPage({ params, searchParams }: PageProps<"/laws/[act]">) {
  const act = await getAct((await params).act);
  if (!act) notFound();
  const unit = act.unit;
  const all = (await searchParams).view === "all";
  const plural = unit === "Article" ? "articles" : "sections";

  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/laws" className="hover:text-foreground">
          Laws
        </Link>{" "}
        / {act.short_name}
      </nav>
      <h1 className="mt-2 page-title">{act.title}</h1>
      <p className="mt-1.5 text-sm text-muted">{act.citation}</p>
      <p className="lede">{act.summary}</p>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <a href={act.source.url} className="btn btn-secondary h-auto min-h-11 py-2.5 leading-tight whitespace-normal" target="_blank" rel="noopener noreferrer">
          Official text: {act.source.publisher.split(",")[0]} <IconOut className="h-4 w-4" />
        </a>
        {all ? (
          <Link href={`/laws/${act.id}`} className="link text-sm">
            Read one {unit.toLowerCase()} at a time
          </Link>
        ) : (
          <Link href={`/laws/${act.id}?view=all`} className="link text-sm">
            Read all {act.sections.length} {plural} on one page
          </Link>
        )}
      </div>
      {act.source.note && <p className="mt-2 text-sm text-muted">{act.source.note}</p>}

      <div
        id="act-reader"
        data-panes=""
        data-all={all ? "" : undefined}
        className="mt-8 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14"
      >
        <aside className="lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:self-start lg:overflow-y-auto">
          <div className="mb-5">
            <LawSearchForm act={act.id} label={`Search the ${act.short_name}`} />
          </div>
          {/* On phones the list starts folded, so the sections themselves come first. */}
          <details className="lg:hidden">
            <summary className="cursor-pointer text-sm font-semibold">
              Jump to one of {act.sections.length} {plural}
            </summary>
            <Contents act={act} />
          </details>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold">
              {act.sections.length} {plural}
            </p>
            <Contents act={act} />
          </div>
        </aside>

        <div className="min-w-0">
          <p className="note-accent mb-4 max-w-[70ch]">
            <strong>These are plain-language summaries written by CivicLens, not the law itself.</strong> They are
            simplified and may leave out conditions and exceptions. Read the official text before relying on them.
          </p>
          {act.sections.map((s, i) => (
            <article
              key={s.anchor}
              id={s.anchor}
              data-pane=""
              data-default={i === 0 ? "" : undefined}
              className="law-section border-b border-line py-7"
            >
              <p className="text-sm font-medium text-accent">
                {unit} {s.number}
              </p>
              <h2 className="mt-1 text-xl font-semibold">{s.title}</h2>
              <p className="prose-civic mt-3">{s.summary}</p>
              {s.official_text ? (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-accent">Official text</summary>
                  <p className="mt-3 max-w-[70ch] border-l-2 border-line pl-4 text-sm whitespace-pre-line text-muted">
                    {s.official_text}
                  </p>
                </details>
              ) : (
                <p className="mt-4 text-xs text-muted">
                  Official wording: {unit} {s.number} of the {act.short_name} on{" "}
                  <a href={act.source.url} className="link" target="_blank" rel="noopener noreferrer">
                    {act.source.title.split(" — ")[0]}
                  </a>
                  .
                </p>
              )}
              {!all && <PrevNext act={act} index={i} />}
            </article>
          ))}
          <FreeHelp topics={ACT_HELP[act.id]} className="mt-10" />
        </div>
        <PaneSwitcher id="act-reader" />
      </div>
    </div>
  );
}

/** Under each section: where it sits in the act, and the sections either side of it. */
function PrevNext({ act, index }: { act: Act; index: number }) {
  const prev = act.sections[index - 1];
  const next = act.sections[index + 1];
  const plural = act.unit === "Article" ? "articles" : "sections";
  return (
    <nav
      aria-label={`${act.unit} ${act.sections[index].number}: previous and next`}
      className="mt-6 grid grid-cols-2 gap-3 border-t-2 border-rule pt-4 text-sm"
    >
      <p className="col-span-2 text-xs text-muted">
        {index + 1} of {act.sections.length} {plural}
      </p>
      {prev ? (
        <a href={`#${prev.anchor}`} className="group flex flex-col items-start gap-0.5 border-2 border-rule bg-surface p-3 hover:bg-accent-soft">
          <span className="caps inline-flex items-center gap-1.5 text-[0.8125rem] text-accent">
            <IconLeft className="h-3 w-3" /> Previous
          </span>
          <span className="font-semibold">
            {act.unit} {prev.number}: {prev.title}
          </span>
        </a>
      ) : (
        <span />
      )}
      {next ? (
        <a href={`#${next.anchor}`} className="group flex flex-col items-end gap-0.5 border-2 border-rule bg-surface p-3 text-right hover:bg-accent-soft">
          <span className="caps inline-flex items-center gap-1.5 text-[0.8125rem] text-accent">
            Next <IconRight className="h-3 w-3" />
          </span>
          <span className="font-semibold">
            {act.unit} {next.number}: {next.title}
          </span>
        </a>
      ) : (
        <span />
      )}
    </nav>
  );
}

function Contents({ act }: { act: Act }) {
  return (
    <ol className="mt-2 space-y-1 text-sm">
      {act.sections.map((s) => (
        <li key={s.anchor}>
          <a
            href={`#${s.anchor}`}
            data-pane-link=""
            className="flex gap-2 px-2 py-1.5 hover:bg-accent-soft aria-[current]:bg-rule aria-[current]:text-background"
          >
            <span className="w-12 shrink-0 font-mono text-xs leading-5 opacity-80">{s.number}</span>
            <span>{s.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}
