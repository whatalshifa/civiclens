"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { readFindQuery } from "@/lib/format";

/**
 * Type a PIN code or the name of a constituency, district or area. A PIN code goes straight to its
 * page; a name goes to /find, which lists the matching seats and places. Without JavaScript the form
 * still works: it submits to /find, which sends a PIN code on to its page.
 */
export function PinForm({
  defaultValue = "",
  size = "lg",
  serverError,
}: {
  defaultValue?: string;
  size?: "lg" | "sm";
  /** An error from a form sent without JavaScript, shown until the person types again. */
  serverError?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(serverError ?? null);
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

  const lg = size === "lg";
  const errorLine = (
    <p
      id={`${id}-error`}
      role="alert"
      className={`mt-2 text-sm font-bold text-rose-700 empty:hidden dark:text-rose-300 ${lg ? "sm:text-base" : ""}`}
    >
      {error && lg && <span className="sr-only">Error: </span>}
      {error}
    </p>
  );
  return (
    <form action="/find" method="get" onSubmit={submit} noValidate role="search">
      <div className={lg && error ? "border-l-4 border-rose-700 pl-4 dark:border-rose-400" : undefined}>
        <label htmlFor={id} className={lg ? "block text-lg font-bold sm:text-xl" : "sr-only"}>
          PIN code or constituency name
        </label>
        {lg && (
          <p id={`${id}-hint`} className="mt-1 text-[0.9375rem] text-muted sm:text-base">
            A six-digit PIN code, or the name of your constituency, district or area. For example, 413102 or Baramati.
          </p>
        )}
        {lg && errorLine}
        <div className={`flex gap-2 ${lg ? "mt-3 max-w-[40rem] flex-col sm:flex-row sm:gap-0" : ""}`}>
          <input
            id={id}
            name="q"
            className={`input min-w-0 ${lg ? "h-14 flex-none text-xl sm:flex-1 sm:rounded-r-none" : "flex-1"} ${error ? "border-rose-700 dark:border-rose-400" : ""}`}
            autoComplete="off"
            inputMode="search"
            maxLength={60}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
              setPending(false);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={[lg ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined}
            placeholder={lg ? undefined : "e.g. 413102 or Baramati"}
          />
          <button
            type="submit"
            className={`btn btn-primary ${lg ? "h-14 px-7 text-lg sm:rounded-l-none" : "h-11"}`}
            disabled={pending}
          >
            {lg && <Search aria-hidden className="h-5 w-5" strokeWidth={2.25} />}
            {pending ? "Finding…" : "Find"}
          </button>
        </div>
        {!lg && errorLine}
      </div>
    </form>
  );
}
