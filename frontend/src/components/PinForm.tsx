"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { readFindQuery } from "@/lib/format";

/**
 * Type a PIN code or the name of a constituency, district or area. A PIN code goes straight to its
 * page; a name goes to /find, which lists the matching seats and places. Without JavaScript the form
 * still works: it submits to /find, which sends a PIN code on to its page.
 */
export function PinForm({ defaultValue = "", size = "lg" }: { defaultValue?: string; size?: "lg" | "sm" }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const id = useId();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = readFindQuery(value);
    if (!query) {
      setError("Type a six-digit PIN code, like 110001, or a name, like Baramati.");
      return;
    }
    setError(null);
    setPending(true);
    router.push("pin" in query ? `/pin/${query.pin}` : `/find?q=${encodeURIComponent(query.name)}`);
  }

  return (
    <form action="/find" method="get" onSubmit={submit} noValidate>
      <label htmlFor={id} className={size === "lg" ? "field-label" : "sr-only"}>
        PIN code or constituency
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          name="q"
          className={`input min-w-0 flex-1 ${size === "lg" ? "h-12 text-lg" : ""}`}
          autoComplete="off"
          placeholder="e.g. 413102 or Baramati"
          maxLength={60}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
            setPending(false);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button type="submit" className={`btn btn-primary ${size === "lg" ? "btn-lg" : "h-11"}`} disabled={pending}>
          {pending ? "Finding…" : "Find"}
        </button>
      </div>
      <p id={`${id}-error`} role="alert" className="mt-2 text-sm font-medium text-rose-700 empty:hidden dark:text-rose-300">
        {error}
      </p>
    </form>
  );
}
