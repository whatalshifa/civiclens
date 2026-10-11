"use client";

import { Children, isValidElement, useId, useRef, useState } from "react";

import { IconLeft, IconRight } from "@/components/icons";

/** Form pieces shared by the letter drafters (RTI application, first appeal, complaints). */

export function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-4 text-lg font-semibold">{legend}</legend>
      {children}
    </fieldset>
  );
}

/**
 * A long form as steps, one fieldset on show at a time, with the steps named across the top, the
 * way a checkout or a tax form does it. Each step's name comes from its fieldset's legend. Without
 * JavaScript (no "js" class on <html>) every step is on show, one after another, as before.
 */
export function Steps({ label, children }: { label: string; children: React.ReactNode }) {
  const steps = Children.toArray(children).filter(isValidElement<{ legend: string }>);
  const [current, setCurrent] = useState(0);
  const top = useRef<HTMLDivElement>(null);
  const id = useId();
  const name = (i: number) => steps[i].props.legend;

  function go(i: number) {
    setCurrent(i);
    const box = top.current?.getBoundingClientRect();
    if (box && box.top < 0) top.current?.scrollIntoView({ block: "start" });
  }

  return (
    <div ref={top} className="space-y-6">
      <nav aria-label={label} className="hidden js:block">
        <ol className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
          {steps.map((step, i) => (
            <li key={i} className="flex">
              <button
                type="button"
                onClick={() => go(i)}
                aria-controls={`${id}-${i}`}
                aria-current={i === current ? "step" : undefined}
                className="flex min-h-11 w-full items-center gap-2 border-2 border-rule bg-surface px-2.5 py-1.5 text-left text-sm leading-tight font-semibold hover:bg-sunken aria-[current]:bg-rule aria-[current]:text-background"
              >
                {name(i)}
              </button>
            </li>
          ))}
        </ol>
      </nav>
      {steps.map((step, i) => (
        <div key={i} id={`${id}-${i}`} className={i === current ? "" : "js:hidden"}>
          {step}
          <div className="mt-6 hidden justify-between gap-3 js:flex">
            {i > 0 ? (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => go(i - 1)}>
                <IconLeft className="h-3 w-3" />
                Back
              </button>
            ) : (
              <span />
            )}
            {i < steps.length - 1 && (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => go(i + 1)}>
                Next: {name(i + 1).replace(/^\d+\.\s*/, "")}
                <IconRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Field({
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

export function Choice<T extends string>({
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
            className="flex min-h-11 cursor-pointer items-center gap-3 border-2 border-line bg-surface px-3 py-2 text-[0.9375rem] has-[:checked]:border-rule has-[:checked]:bg-accent-soft has-[:checked]:font-semibold"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Check({
  checked,
  onChange,
  title,
  detail,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  detail?: string;
}) {
  return (
    <label className="flex items-start gap-3 border-2 border-line bg-surface p-3 text-[0.9375rem]">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="font-semibold">{title}</span>
        {detail && <span className="block text-muted">{detail}</span>}
      </span>
    </label>
  );
}

type Common = { label: string; value: string; onChange: (value: string) => void; optional?: boolean; hint?: string };

export function TextField({
  max = 200,
  type = "text",
  autoComplete = "off",
  placeholder,
  ...field
}: Common & { max?: number; type?: "text" | "tel" | "email"; autoComplete?: string; placeholder?: string }) {
  return (
    <Field label={field.label} optional={field.optional} hint={field.hint}>
      {(id) => (
        <input
          id={id}
          className="input"
          type={type}
          value={field.value}
          onChange={(e) => field.onChange(e.target.value)}
          maxLength={max}
          autoComplete={autoComplete}
          placeholder={placeholder}
        />
      )}
    </Field>
  );
}

export function TextArea({
  max = 1500,
  tall = false,
  autoComplete = "off",
  placeholder,
  ...field
}: Common & { max?: number; tall?: boolean; autoComplete?: string; placeholder?: string }) {
  return (
    <Field label={field.label} optional={field.optional} hint={field.hint}>
      {(id) => (
        <textarea
          id={id}
          className={`input py-3 leading-relaxed ${tall ? "min-h-36" : "min-h-20"}`}
          value={field.value}
          onChange={(e) => field.onChange(e.target.value)}
          maxLength={max}
          autoComplete={autoComplete}
          placeholder={placeholder}
        />
      )}
    </Field>
  );
}

export function DateField({ max, ...field }: Common & { max?: string }) {
  return (
    <Field label={field.label} optional={field.optional} hint={field.hint}>
      {(id) => (
        <input
          id={id}
          className="input"
          type="date"
          value={field.value}
          max={max}
          onChange={(e) => field.onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

/** Name, address, phone, email, place and date: the same block at the end of every letter. */
export function YourDetails<
  D extends { name: string; address: string; phone: string; email: string; place: string; date: string },
>({
  legend,
  draft,
  set,
  addressHint,
}: {
  legend: string;
  draft: D;
  set: (key: "name" | "address" | "phone" | "email" | "place" | "date", value: string) => void;
  addressHint?: string;
}) {
  return (
    <Fieldset legend={legend}>
      <TextField label="Your name" value={draft.name} onChange={(v) => set("name", v)} max={120} autoComplete="name" />
      <TextArea
        label="Your address"
        hint={addressHint}
        value={draft.address}
        onChange={(v) => set("address", v)}
        max={300}
        autoComplete="street-address"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Phone"
          optional
          type="tel"
          value={draft.phone}
          onChange={(v) => set("phone", v)}
          max={20}
          autoComplete="tel"
        />
        <TextField
          label="Email"
          optional
          type="email"
          value={draft.email}
          onChange={(v) => set("email", v)}
          max={120}
          autoComplete="email"
        />
        <TextField
          label="Place"
          value={draft.place}
          onChange={(v) => set("place", v)}
          max={60}
          autoComplete="address-level2"
        />
        <DateField label="Date" value={draft.date} onChange={(v) => set("date", v)} />
      </div>
    </Fieldset>
  );
}
