"use client";

import { useMemo, useState } from "react";

import { Check, Choice, Field, Fieldset } from "@/components/letters/form";
import { LetterPreview } from "@/components/letters/LetterPreview";
import { RtiRuleCard } from "@/components/rti/RtiRuleCard";
import { SentTracker } from "@/components/rti/SentTracker";
import {
  buildLetter,
  EMPTY_DRAFT,
  FEE_MODES,
  type FeeMode,
  type Format,
  FORMATS,
  missing,
  type RtiDraft,
} from "@/lib/rti";
import { JURISDICTIONS, RTI_RULES, type Jurisdiction } from "@/lib/rti-states";

/** The RTI application form with a live preview of the letter. Nothing typed here leaves the browser. */
export function RtiDrafter({
  authority = "",
  information = "",
  today,
}: {
  authority?: string;
  information?: string;
  today: string; // from the server, so the server and the browser render the same letter
}) {
  const [draft, setDraft] = useState<RtiDraft>({
    ...EMPTY_DRAFT,
    authority,
    information,
    date: today,
  });
  const letter = useMemo(() => buildLetter(draft), [draft]);
  const todo = missing(draft);

  function set<K extends keyof RtiDraft>(key: K, value: RtiDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10">
      <form
        className="space-y-8 print:hidden"
        onSubmit={(e) => e.preventDefault()}
        aria-label="RTI application details"
      >
        <Fieldset legend="1. Where it goes">
          <Field
            label="Which government runs the office"
            hint="Ministries, railways, central universities and government banks are central. Police, schools, hospitals and municipal offices are usually the state's."
          >
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
          <RtiRuleCard jurisdiction={draft.jurisdiction} />
          <Field
            label="Public authority (the office that has the information)"
            hint="Be specific: the department and district, if you know them."
          >
            {(id) => (
              <input
                id={id}
                className="input"
                value={draft.authority}
                onChange={(e) => set("authority", e.target.value)}
                placeholder="e.g. Office of the District Supply Officer, Pune"
                maxLength={200}
                autoComplete="off"
              />
            )}
          </Field>
          <Field label="Office address" optional>
            {(id) => (
              <textarea
                id={id}
                className="input min-h-20 py-3"
                value={draft.authorityAddress}
                onChange={(e) => set("authorityAddress", e.target.value)}
                maxLength={300}
                autoComplete="off"
              />
            )}
          </Field>
        </Fieldset>

        <Fieldset legend="2. What you want to know">
          <Field
            label="Information you are asking for"
            hint="One item per line. Ask for specific records or facts (dates, names, copies of documents), not opinions or reasons."
          >
            {(id) => (
              <textarea
                id={id}
                className="input min-h-36 py-3 leading-relaxed"
                value={draft.information}
                onChange={(e) => set("information", e.target.value)}
                placeholder={
                  "e.g. The current status of my application no. 1234 dated 2 March 2026\nThe names of the officials it is pending with"
                }
                maxLength={3000}
              />
            )}
          </Field>
          <Field label="Period the information should cover" optional>
            {(id) => (
              <input
                id={id}
                className="input"
                value={draft.period}
                onChange={(e) => set("period", e.target.value)}
                placeholder="e.g. 1 April 2025 to today"
                maxLength={120}
              />
            )}
          </Field>
          <Choice
            legend="How you want it"
            value={draft.format}
            options={Object.entries(FORMATS).map(([value, label]) => ({
              value: value as Format,
              label: label.en,
            }))}
            onChange={(v) => set("format", v)}
          />
          <Check
            checked={draft.lifeOrLiberty}
            onChange={(v) => set("lifeOrLiberty", v)}
            title="It concerns someone's life or liberty"
            detail="For example, a person held in custody. The office must then reply within 48 hours."
          />
        </Fieldset>

        <Fieldset legend="3. Fee">
          <Choice
            legend="How you are paying the fee"
            value={draft.feeMode}
            options={Object.entries(FEE_MODES).map(([value, label]) => ({
              value: value as FeeMode,
              label: label.en,
            }))}
            onChange={(v) => set("feeMode", v)}
            columns
          />
          {draft.feeMode !== "bpl" && (
            <Field label="Payment reference" optional hint="The postal order or draft number, or the receipt number.">
              {(id) => (
                <input
                  id={id}
                  className="input"
                  value={draft.feeReference}
                  onChange={(e) => set("feeReference", e.target.value)}
                  maxLength={80}
                />
              )}
            </Field>
          )}
        </Fieldset>

        <Fieldset legend="4. Your details">
          <Field label="Your name">
            {(id) => (
              <input
                id={id}
                className="input"
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
                maxLength={120}
                autoComplete="name"
              />
            )}
          </Field>
          <Field label="Your address" hint="The reply is sent here.">
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
            <Field label="Phone" optional>
              {(id) => (
                <input
                  id={id}
                  className="input"
                  type="tel"
                  value={draft.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  maxLength={20}
                  autoComplete="tel"
                />
              )}
            </Field>
            <Field label="Email" optional>
              {(id) => (
                <input
                  id={id}
                  className="input"
                  type="email"
                  value={draft.email}
                  onChange={(e) => set("email", e.target.value)}
                  maxLength={120}
                  autoComplete="email"
                />
              )}
            </Field>
            <Field label="Place">
              {(id) => (
                <input
                  id={id}
                  className="input"
                  value={draft.place}
                  onChange={(e) => set("place", e.target.value)}
                  maxLength={60}
                  autoComplete="address-level2"
                />
              )}
            </Field>
            <Field label="Date">
              {(id) => (
                <input
                  id={id}
                  className="input"
                  type="date"
                  value={draft.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              )}
            </Field>
          </div>
        </Fieldset>
      </form>

      <LetterPreview
        title="Your application"
        letter={letter}
        filename="rti-application.txt"
        todo={todo}
        language={draft.language}
        onLanguage={(lang) => set("language", lang)}
      >
        <SentTracker
          today={today}
          application={{
            authority: draft.authority,
            authorityAddress: draft.authorityAddress,
            information: draft.information,
            jurisdiction: draft.jurisdiction,
            lifeOrLiberty: draft.lifeOrLiberty,
            name: draft.name,
            address: draft.address,
            phone: draft.phone,
            email: draft.email,
            place: draft.place,
          }}
        />
      </LetterPreview>
    </div>
  );
}
