import { Ref, type SourceNotes } from "@/components/Sources";
import { formatDate, formatPercent, formatRupees } from "@/lib/format";
import type { MemberRecord } from "@/lib/types";

const COUNT = new Intl.NumberFormat("en-IN");

/** Cites the record's sources in the order the card shows them, for pages that number them first. */
export function citeRecord(notes: SourceNotes, record: MemberRecord | null) {
  if (!record) return;
  notes.cite(record.questions_source);
  notes.cite(record.attendance_source);
  notes.cite(record.fund_source);
}

/**
 * An MP's questions, attendance and local area fund, each beside the average for all MPs. The
 * average is context, never a verdict: there's no score, rank, colour or "good"/"bad" here, and
 * every MP's card shows the same rows.
 */
export function ParliamentRecord({ record, notes }: { record: MemberRecord; notes: SourceNotes }) {
  const attended = record.days_signed !== null && record.sitting_days ? record.days_signed / record.sitting_days : null;
  const fund = record.fund_allocated !== null && record.fund_spent !== null ? record : null;
  return (
    <section className="mt-5 border-t border-line pt-4" aria-label="Record in office">
      <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">In Parliament</h3>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted">Questions asked</dt>
        <dd>
          {COUNT.format(record.questions)}
          <Average>{COUNT.format(Math.round(record.questions_average))}</Average>
          <Ref n={notes.cite(record.questions_source)} source={record.questions_source} />
        </dd>
        <dt className="text-muted">Attendance</dt>
        <dd>
          {attended !== null ? (
            <>
              Signed the register on {record.days_signed} of {record.sitting_days} sitting days (
              {formatPercent(100 * attended)})<Average>{formatPercent(record.attendance_average)}</Average>
            </>
          ) : (
            <>Not recorded. Ministers and the Speaker don&apos;t sign the attendance register.</>
          )}
          <Ref n={notes.cite(record.attendance_source)} source={record.attendance_source} />
        </dd>
      </dl>

      <h3 className="mt-4 text-xs font-semibold tracking-wide text-muted uppercase">MP fund (MPLADS)</h3>
      {fund ? (
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted">Available</dt>
          <dd>
            {formatRupees(fund.fund_allocated!)}
            <Ref n={notes.cite(record.fund_source)} source={record.fund_source} />
          </dd>
          <dt className="text-muted">Spent so far</dt>
          <dd>
            {formatRupees(fund.fund_spent!)}
            {fund.fund_allocated! > 0 && <> ({formatPercent((100 * fund.fund_spent!) / fund.fund_allocated!)})</>}
            <Average>{formatPercent(record.fund_spent_average)}</Average>
          </dd>
          <dt className="text-muted">Works</dt>
          <dd>
            {COUNT.format(fund.works_recommended!)} recommended, {COUNT.format(fund.works_sanctioned!)} sanctioned,{" "}
            {COUNT.format(fund.works_completed!)} completed
          </dd>
        </dl>
      ) : (
        <p className="mt-2 text-sm text-muted">
          Not matched on the MPLADS dashboard yet. You can look this MP up there by state and constituency.
          <Ref n={notes.cite(record.fund_source)} source={record.fund_source} />
        </p>
      )}
      <p className="mt-3 text-xs text-muted">
        Counted from the start of the 18th Lok Sabha in June 2024 to {formatDate(record.as_of)}. The average for all MPs
        is there for context, not as a score.
      </p>
    </section>
  );
}

function Average({ children }: { children: React.ReactNode }) {
  return <span className="text-muted"> · average for all MPs {children}</span>;
}
