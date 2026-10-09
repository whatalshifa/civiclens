import Link from "next/link";

import type { StepEvent } from "@/lib/types";

const ICONS: Record<StepEvent["tool"], string> = {
  search_laws: "M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm5.3-2.2L21 21",
  read_section: "M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15ZM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5",
  find_representatives:
    "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  prepare_rti_request: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Zm0 0v6h6M8 13h8M8 17h5",
};

/** The steps the assistant took, as a timeline: what it searched for and what it read. */
export function Steps({ steps, working = false }: { steps: StepEvent[]; working?: boolean }) {
  return (
    <ol className="relative space-y-3" aria-label="Steps the assistant took">
      {steps.map((step, i) => (
        <li key={i} className="relative flex gap-3">
          {(i < steps.length - 1 || working) && (
            <span aria-hidden className="absolute top-8 bottom-[-0.75rem] left-[0.9375rem] w-px bg-line" />
          )}
          <span
            aria-hidden
            className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
              step.error ? "border-amber-500/50 bg-amber-50 dark:bg-amber-950/40" : "border-line bg-surface"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d={ICONS[step.tool] ?? ICONS.search_laws} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="min-w-0 pt-1">
            <p className="text-sm font-medium">{step.label}</p>
            {step.detail && <p className="text-xs text-muted">{step.detail}</p>}
            {step.tool === "search_laws" && step.found && step.found.length > 0 && (
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {step.found.map((f) => (
                  <li key={`${f.act_id}-${f.number}`} className="badge bg-sunken font-medium text-muted">
                    {f.act_short_name} {f.unit === "Article" ? "Art." : "s."} {f.number}
                  </li>
                ))}
              </ul>
            )}
            {step.tool === "find_representatives" && step.pin && !step.error && (
              <Link href={`/pin/${step.pin}`} className="link text-xs">
                See the representatives for {step.pin}
              </Link>
            )}
          </div>
        </li>
      ))}
      {working && (
        <li className="flex items-center gap-3" aria-live="polite">
          <span className="relative flex h-8 w-8 items-center justify-center">
            <span className="h-2.5 w-2.5 animate-ping rounded-full bg-teal-600/60" />
          </span>
          <span className="text-sm text-muted">{steps.length ? "Working…" : "Starting…"}</span>
        </li>
      )}
    </ol>
  );
}
