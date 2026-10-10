"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

import { formatDate } from "@/lib/letters";
import { appealBy, forgetSent, loadSent, reminderIcs, replyDue, saveSent, type SentRti } from "@/lib/rti-tracker";

/**
 * "I sent it on ...": after drafting, remember the application in this browser and get a calendar
 * reminder for the day the reply is due. The first-appeal page reads it back.
 */
export function SentTracker({ application, today }: { application: Omit<SentRti, "sentOn">; today: string }) {
  const [saved, setSaved] = useState<SentRti | null>(null);
  const [sentOn, setSentOn] = useState(today);
  const [failed, setFailed] = useState(false);
  const id = useId();

  useEffect(() => {
    // localStorage only exists in the browser, so this can't be read during the server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(loadSent());
  }, []);

  function save() {
    const value = { ...application, sentOn };
    if (saveSent(value)) {
      setSaved(value);
      setFailed(false);
    } else {
      setFailed(true);
    }
  }

  function calendar(value: SentRti) {
    const blob = new Blob([reminderIcs(value, window.location.origin)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rti-reply-due.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (saved) {
    const due = replyDue(saved.sentOn, saved.lifeOrLiberty);
    return (
      <section aria-labelledby={`${id}-h`} className="mt-6 rounded-xl border border-line bg-surface p-4 text-sm">
        <h3 id={`${id}-h`} className="font-semibold">
          Sent on {formatDate(saved.sentOn)}
          {saved.authority.trim() ? ` to ${saved.authority.trim()}` : ""}
        </h3>
        <p className="mt-1 text-muted">
          The reply is due by <strong className="text-foreground">{formatDate(due)}</strong>. If none comes, or it
          doesn&apos;t answer what you asked, you can file a first appeal until{" "}
          {formatDate(appealBy(saved.sentOn, saved.lifeOrLiberty))}.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => calendar(saved)}>
            Add a reminder to my calendar
          </button>
          <Link href="/rti/appeal" className="btn btn-secondary btn-sm">
            Draft the first appeal
          </Link>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              forgetSent();
              setSaved(null);
            }}
          >
            Forget it
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">Saved in this browser only. CivicLens never receives it.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby={`${id}-h`} className="mt-6 rounded-xl border border-line bg-surface p-4 text-sm">
      <h3 id={`${id}-h`} className="font-semibold">
        Sent it? Track the reply
      </h3>
      <p className="mt-1 text-muted">
        Note the day you sent it and get a calendar reminder for when the reply is due. If it doesn&apos;t come, the
        first appeal is filled in from this application.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor={`${id}-date`} className="field-label">
            I sent it on
          </label>
          <input
            id={`${id}-date`}
            type="date"
            className="input"
            value={sentOn}
            max={today}
            onChange={(e) => setSentOn(e.target.value)}
          />
        </div>
        <button type="button" className="btn btn-secondary" onClick={save} disabled={!sentOn}>
          Save in this browser
        </button>
      </div>
      {failed && (
        <p className="mt-2 text-sm" role="alert">
          This browser won&apos;t let the page save anything. Note the date yourself: the reply is due 30 days after the
          office receives it.
        </p>
      )}
    </section>
  );
}
