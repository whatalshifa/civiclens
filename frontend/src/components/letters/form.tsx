"use client";

import { useId } from "react";

/** Form pieces shared by the letter drafters (RTI application, first appeal, complaints). */

export function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 text-base font-semibold">{legend}</legend>
      {children}
    </fieldset>
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
    <label className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3 text-sm">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 accent-teal-700"
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
