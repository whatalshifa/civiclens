import type { Metadata } from "next";
import Link from "next/link";

import { OldToNewMatch } from "@/components/OldToNew";
import { SourceList } from "@/components/Sources";
import { api } from "@/lib/api";
import type { OldCode, OldLookup } from "@/lib/types";

export const metadata: Metadata = {
  title: "Old IPC, CrPC or Evidence Act section? Find the new one",
  description:
    "IPC 420 is now BNS 318(4), CrPC 154 is BNSS 173. Type an old section number to find its new number under the BNS, BNSS or BSA, from the official correspondence tables.",
};

const EXAMPLES = ["IPC 420", "IPC 498A", "CrPC 154", "CrPC 438", "Evidence Act 65B", "BNS 318"];

export default async function OldToNewPage({ searchParams }: PageProps<"/laws/old-to-new">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 200) : "";
  const [codes, result] = await Promise.all([
    api<OldCode[]>("/api/laws/old-to-new"),
    q ? api<OldLookup>(`/api/laws/old-to-new/lookup?${new URLSearchParams({ q })}`) : null,
  ]);

  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/laws" className="hover:text-foreground">
          Laws
        </Link>{" "}
        / Old to new sections
      </nav>
      <h1 className="mt-2 page-title">
        Find the new number for an old section
      </h1>
      <p className="lede">
        On 1 July 2024 three new laws replaced the old criminal codes: the Bharatiya Nyaya Sanhita (BNS) replaced the
        Indian Penal Code (IPC), the Bharatiya Nagarik Suraksha Sanhita (BNSS) replaced the Code of Criminal Procedure
        (CrPC), and the Bharatiya Sakshya Adhiniyam (BSA) replaced the Indian Evidence Act. Most sections got new
        numbers.
      </p>

      <form action="/laws/old-to-new" method="get" role="search" className="mt-8 flex max-w-xl flex-wrap gap-x-2">
        <label htmlFor="old-section" className="field-label basis-full">
          Old section
        </label>
        <input
          id="old-section"
          name="q"
          defaultValue={q}
          className="input min-w-0 flex-1"
          placeholder="e.g. IPC 420"
          maxLength={200}
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary h-11">
          Find
        </button>
      </form>
      <p className="mt-3 text-sm text-muted">
        Try:{" "}
        {EXAMPLES.map((example, i) => (
          <span key={example}>
            {i > 0 && ", "}
            <Link href={`/laws/old-to-new?q=${encodeURIComponent(example)}`} className="link">
              {example}
            </Link>
          </span>
        ))}
      </p>

      {result && (
        <section className="mt-8 max-w-3xl" aria-labelledby="result-heading" aria-live="polite">
          <h2 id="result-heading" className="sr-only">
            Result
          </h2>
          {result.matches.length === 0 ? (
            <p className="note">
              {result.numbers.length === 0
                ? "Type a section number, like IPC 420 or CrPC 154."
                : `We don't have ${result.numbers.join(", ")} in the tables below yet. Check the official correspondence tables linked at the bottom of this page.`}
            </p>
          ) : (
            <ul className="grid gap-3">
              {result.matches.map((m) => (
                <li key={`${m.code}-${m.number}`}>
                  <OldToNewMatch match={m} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <p className="note-accent mt-8 max-w-3xl">
        An offence committed before 1 July 2024 is still charged under the old law. Check the official text before
        relying on a number.
      </p>

      {codes.map((code) => (
        <section key={code.code} className="mt-14" aria-labelledby={`table-${code.code}`}>
          <h2 id={`table-${code.code}`} className="section-title">
            {code.short_name} to {code.new_act_short_name}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {code.name} to the{" "}
            <Link href={`/laws/${code.new_act_id}`} className="link">
              {code.new_act_title}
            </Link>
            . {code.sections.length} common sections.
          </p>
          <div
            className="mt-4 overflow-x-auto rounded-xl border border-line"
            tabIndex={0}
            role="region"
            aria-label={`${code.short_name} to ${code.new_act_short_name} table`}
          >
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="bg-sunken">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    {code.short_name}
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    {code.new_act_short_name}
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    What it covers
                  </th>
                </tr>
              </thead>
              <tbody>
                {code.sections.map((s) => (
                  <tr key={s.number} className="border-t border-line">
                    <td className="px-4 py-2.5 font-mono text-[0.8125rem] whitespace-nowrap">{s.number}</td>
                    <td className="px-4 py-2.5 font-mono text-[0.8125rem] whitespace-nowrap">
                      {s.new_number === null ? (
                        "None"
                      ) : s.anchor ? (
                        <Link href={`/laws/${s.new_act_id}#${s.anchor}`} className="link">
                          {s.new_number}
                        </Link>
                      ) : (
                        s.new_number
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-muted">{s.note ?? s.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <SourceList sources={codes.map((c) => c.source)} heading="Where these tables come from" />
    </div>
  );
}
