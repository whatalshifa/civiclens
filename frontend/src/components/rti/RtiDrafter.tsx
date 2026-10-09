"use client";

import { useId, useMemo, useState } from "react";

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
  const [copied, setCopied] = useState(false);
  const letter = useMemo(() => buildLetter(draft), [draft]);
  const todo = missing(draft);

  function set<K extends keyof RtiDraft>(key: K, value: RtiDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setCopied(false);
  }

  function download() {
    const blob = new Blob([letter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rti-application.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const hi = draft.language === "hi";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10">
      <form
        className="space-y-8 print:hidden"
        onSubmit={(e) => e.preventDefault()}
        aria-label="RTI application details"
      >
        <Fieldset legend="1. Where it goes">
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
          <label className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-teal-700"
              checked={draft.lifeOrLiberty}
              onChange={(e) => set("lifeOrLiberty", e.target.checked)}
            />
            <span>
              <span className="font-semibold">It concerns someone&apos;s life or liberty</span>
              <span className="block text-muted">
                For example, a person held in custody. The office must then reply within 48 hours.
              </span>
            </span>
          </label>
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

      <div className="lg:sticky lg:top-20 lg:self-start">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <h2 className="font-semibold">Your application</h2>
          <div
            role="radiogroup"
            aria-label="Language of the letter"
            className="flex rounded-xl border border-line bg-surface p-0.5"
          >
            {(["en", "hi"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                role="radio"
                aria-checked={draft.language === lang}
                onClick={() => set("language", lang)}
                className="btn btn-sm aria-checked:bg-teal-800 aria-checked:text-white"
                lang={lang}
              >
                {lang === "en" ? "English" : "हिंदी"}
              </button>
            ))}
          </div>
        </div>

        <article
          aria-label="Letter preview"
          tabIndex={0}
          lang={hi ? "hi" : "en"}
          className="card max-h-[70vh] overflow-auto p-5 font-serif text-[0.95rem] leading-relaxed whitespace-pre-wrap sm:p-8 lg:max-h-[calc(100vh-14rem)] print:max-h-none print:overflow-visible print:border-0 print:p-0 print:shadow-none"
        >
          {letter}
        </article>

        <div className="mt-4 print:hidden">
          {todo.length > 0 && (
            <p className="mb-3 text-sm text-muted" aria-live="polite">
              Still to fill in: {todo.join(", ")}.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={() => window.print()}>
              Print or save as PDF
            </button>
            <button type="button" className="btn btn-secondary" onClick={download}>
              Download
            </button>
            <button type="button" className="btn btn-secondary" onClick={copy}>
              {copied ? "Copied" : "Copy text"}
            </button>
          </div>
          <p className="mt-3 text-xs text-muted">
            Everything you type stays in this browser. CivicLens never receives or stores it.
          </p>
        </div>
      </div>
    </div>
  );
}

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 text-base font-semibold">{legend}</legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  hint,
  optional = false,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: (id: string) => React.ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {optional && <span className="ml-1.5 font-normal text-muted">(optional)</span>}
      </label>
      {children(id)}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

function Choice<T extends string>({
  legend,
  value,
  options,
  onChange,
  columns = false,
}: {
  legend: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  columns?: boolean;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend className="field-label">{legend}</legend>
      <div className={`grid gap-2 ${columns ? "sm:grid-cols-2" : ""}`}>
        {options.map((option) => (
          <label
            key={option.value}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2 text-sm has-[:checked]:border-teal-600/60 has-[:checked]:bg-accent-soft"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="h-4 w-4 accent-teal-700"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
