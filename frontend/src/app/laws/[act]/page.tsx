import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ACT_HELP, FreeHelp } from "@/components/FreeHelp";
import { LawSearchForm } from "@/components/LawSearchForm";
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

export default async function ActPage({ params }: PageProps<"/laws/[act]">) {
  const act = await getAct((await params).act);
  if (!act) notFound();
  const unit = act.unit;

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
      <div className="mt-5 flex flex-wrap gap-3">
        <a href={act.source.url} className="btn btn-secondary" target="_blank" rel="noopener noreferrer">
          Official text: {act.source.publisher.split(",")[0]} <ExternalLink aria-hidden className="h-4 w-4" />
        </a>
      </div>
      {act.source.note && <p className="mt-2 text-sm text-muted">{act.source.note}</p>}

      <div className="mt-12 grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14">
        <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
          <div className="mb-5">
            <LawSearchForm act={act.id} label={`Search the ${act.short_name}`} />
          </div>
          {/* On phones the list starts folded, so the sections themselves come first. */}
          <details className="lg:hidden">
            <summary className="cursor-pointer text-sm font-semibold">
              Jump to one of {act.sections.length} {unit === "Article" ? "articles" : "sections"}
            </summary>
            <Contents act={act} />
          </details>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold">
              {act.sections.length} {unit === "Article" ? "articles" : "sections"}
            </p>
            <Contents act={act} />
          </div>
        </aside>

        <div className="min-w-0">
          <p className="note-accent mb-4 max-w-[70ch]">
            <strong>These are plain-language summaries written by CivicLens, not the law itself.</strong> They are
            simplified and may leave out conditions and exceptions. Read the official text before relying on them.
          </p>
          {act.sections.map((s) => (
            <article key={s.anchor} id={s.anchor} className="law-section border-b border-line py-7">
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
            </article>
          ))}
          <FreeHelp topics={ACT_HELP[act.id]} className="mt-12" />
        </div>
      </div>
    </div>
  );
}

function Contents({ act }: { act: Act }) {
  return (
    <ol className="mt-2 space-y-1 text-sm">
      {act.sections.map((s) => (
        <li key={s.anchor}>
          <a href={`#${s.anchor}`} className="flex gap-2 rounded-lg px-2 py-1.5 hover:bg-sunken">
            <span className="w-12 shrink-0 font-mono text-xs leading-5 text-muted">{s.number}</span>
            <span>{s.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}
