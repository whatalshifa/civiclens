"use client";

import { useEffect, useMemo, useState } from "react";

import { Check, Field, Fieldset } from "@/components/letters/form";
import { LetterPreview } from "@/components/letters/LetterPreview";
import { formatDate } from "@/lib/letters";
import { type AppealDraft, buildAppeal, EMPTY_APPEAL, type Ground, GROUNDS, missing } from "@/lib/rti-appeal";
import { JURISDICTIONS, RTI_RULES, type Jurisdiction } from "@/lib/rti-states";
import { loadSent, replyDue, type SentRti } from "@/lib/rti-tracker";

/** The first appeal under section 19(1), filled in from a saved application when there is one. */
export function AppealDrafter({ today }: { today: string }) {
  const [draft, setDraft] = useState<AppealDraft>({ ...EMPTY_APPEAL, date: today });
  const [saved, setSaved] = useState<SentRti | null>(null);
  const letter = useMemo(() => buildAppeal(draft), [draft]);
  const todo = missing(draft);

  useEffect(() => {
    // localStorage only exists in the browser, so this can't be read during the server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(loadSent());
  }, []);

  function set<K extends keyof AppealDraft>(key: K, value: AppealDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function toggle(ground: Ground, on: boolean) {
    setDraft((d) => ({ ...d, grounds: on ? [...d.grounds, ground] : d.grounds.filter((g) => g !== ground) }));
  }

  function fillFromSaved(s: SentRti) {
    const overdue = replyDue(s.sentOn, s.lifeOrLiberty) < today;
    setDraft((d) => ({
      ...d,
      authority: s.authority,
      authorityAddress: s.authorityAddress,
      information: s.information,
      jurisdiction: s.jurisdiction,
      applicationDate: s.sentOn,
      name: s.name,
      address: s.address,
      phone: s.phone,
      email: s.email,
      place: s.place,
      grounds: overdue && !d.replyDate && !d.grounds.includes("noReply") ? [...d.grounds, "noReply"] : d.grounds,
    }));
  }

  const text = (
    key: keyof AppealDraft,
    label: string,
    opts: { optional?: boolean; hint?: string; max?: number; auto?: string } = {},
  ) => (
    <Field label={label} optional={opts.optional} hint={opts.hint}>
      {(id) => (
        <input
          id={id}
          className="input"
          value={draft[key] as string}
          onChange={(e) => set(key, e.target.value as never)}
          maxLength={opts.max ?? 200}
          autoComplete={opts.auto ?? "off"}
        />
      )}
    </Field>
  );

  const date = (key: "applicationDate" | "replyDate" | "date", label: string, optional = false, hint?: string) => (
    <Field label={label} optional={optional} hint={hint}>
      {(id) => (
        <input
          id={id}
          className="input"
          type="date"
          value={draft[key]}
          max={today}
          onChange={(e) => set(key, e.target.value)}
        />
      )}
    </Field>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10">
      <form className="space-y-8 print:hidden" onSubmit={(e) => e.preventDefault()} aria-label="First appeal details">
        {saved && (
          <div className="flex flex-col gap-3 rounded-sm border border-teal-600/30 bg-accent-soft p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p>
              You saved an application sent on <strong>{formatDate(saved.sentOn)}</strong>
              {saved.authority.trim() ? ` to ${saved.authority.trim()}` : ""}.
            </p>
            <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={() => fillFromSaved(saved)}>
              Fill in from it
            </button>
          </div>
        )}

        <Fieldset legend="1. Your application">
          {text("authority", "Public authority you applied to", {
            hint: "The appeal goes to the officer senior to the PIO, in the same office.",
          })}
          <Field label="Office address" optional>
            {(id) => (
              <textarea
                id={id}
                className="input min-h-20 py-3"
                value={draft.authorityAddress}
                onChange={(e) => set("authorityAddress", e.target.value)}
                maxLength={300}
              />
            )}
          </Field>
          <Field label="Which government runs the office">
            {(id) => (
              <select
                id={id}
                className="input"
                value={draft.jurisdiction}
                onChange={(e) => set("jurisdiction", e.target.value as Jurisdiction)}
              >
                {JURISDICTIONS.map((j) => (
                  <option key={j} value={j}>
                    {RTI_RULES[j].name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            {date("applicationDate", "Date you sent the application")}
            {text("applicationRef", "Registration or receipt number", { optional: true, max: 80 })}
          </div>
          <Field label="Information you asked for" hint="One item per line, as in your application.">
            {(id) => (
              <textarea
                id={id}
                className="input min-h-28 py-3 leading-relaxed"
                value={draft.information}
                onChange={(e) => set("information", e.target.value)}
                maxLength={3000}
              />
            )}
          </Field>
          {date("replyDate", "Date of the reply, if one came", true, "Leave this empty if there was no reply.")}
        </Fieldset>

        <Fieldset legend="2. Why you are appealing">
          {(Object.keys(GROUNDS) as Ground[]).map((g) => (
            <Check
              key={g}
              checked={draft.grounds.includes(g)}
              onChange={(on) => toggle(g, on)}
              title={GROUNDS[g].title}
              detail={GROUNDS[g].detail}
            />
          ))}
          <Field label="Anything else" optional hint="One point per line, in your own words.">
            {(id) => (
              <textarea
                id={id}
                className="input min-h-20 py-3"
                value={draft.otherGrounds}
                onChange={(e) => set("otherGrounds", e.target.value)}
                maxLength={1500}
              />
            )}
          </Field>
          <Check
            checked={draft.hearing}
            onChange={(v) => set("hearing", v)}
            title="Ask to be heard before the decision"
            detail="You can explain your case in person or by video."
          />
        </Fieldset>

        <Fieldset legend="3. Your details">
          {text("name", "Your name", { max: 120, auto: "name" })}
          <Field label="Your address">
            {(id) => (
              <textarea
                id={id}
                className="input min-h-20 py-3"
                value={draft.address}
                onChange={(e) => set("address", e.target.value)}
                maxLength={300}
                autoComplete="street-address"
              />
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            {text("phone", "Phone", { optional: true, max: 20, auto: "tel" })}
            {text("email", "Email", { optional: true, max: 120, auto: "email" })}
            {text("place", "Place", { max: 60, auto: "address-level2" })}
            {date("date", "Date")}
          </div>
        </Fieldset>
      </form>

      <LetterPreview
        title="Your first appeal"
        letter={letter}
        filename="rti-first-appeal.txt"
        todo={todo}
        language={draft.language}
        onLanguage={(lang) => set("language", lang)}
      />
    </div>
  );
}
