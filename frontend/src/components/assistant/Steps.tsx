import Link from "next/link";

import { IconDocument, IconLetter, IconPlace, IconSearch } from "@/components/icons";
import type { StepEvent } from "@/lib/types";

const ICONS: Record<StepEvent["tool"], (p: { className?: string }) => React.ReactNode> = {
  search_laws: IconSearch,
  read_section: IconDocument,
  find_representatives: IconPlace,
  prepare_rti_request: IconLetter,
};

function StepIcon({ tool }: { tool: StepEvent["tool"] }) {
  const Icon = ICONS[tool] ?? ICONS.search_laws;
  return <Icon className="h-4 w-4" />;
}

/** The steps the assistant took, as a timeline: what it searched for and what it read. */
export function Steps({ steps, working = false }: { steps: StepEvent[]; working?: boolean }) {
  return (
    <ol className="relative space-y-3" aria-label="Steps the assistant took">
      {steps.map((step, i) => (
        <li key={i} className="relative flex gap-3">
          {(i < steps.length - 1 || working) && (
            <span aria-hidden className="absolute top-8 bottom-[-0.75rem] left-[0.9375rem] w-0.5 bg-rule" />
          )}
          <span
            aria-hidden
            className={`relative flex h-8 w-8 shrink-0 items-center justify-center border-2 ${
              step.error ? "border-signal bg-signal text-signal-ink" : "border-rule bg-surface text-accent"
            }`}
          >
            <StepIcon tool={step.tool} />
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
            <span className="h-2.5 w-2.5 animate-ping bg-accent/60" />
          </span>
          <span className="text-sm text-muted">{steps.length ? "Working…" : "Starting…"}</span>
        </li>
      )}
    </ol>
  );
}
