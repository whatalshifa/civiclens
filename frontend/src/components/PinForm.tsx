"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { cleanPin } from "@/lib/format";

/**
 * Type a PIN code, go to its page. Without JavaScript the form still works: it submits to /find,
 * which redirects to the same page.
 */
export function PinForm({ defaultValue = "", size = "lg" }: { defaultValue?: string; size?: "lg" | "sm" }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const id = useId();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const pin = cleanPin(value);
    if (!pin) {
      setError("A PIN code is six digits and doesn't start with 0, like 110001.");
      return;
    }
    setError(null);
    setPending(true);
    router.push(`/pin/${pin}`);
  }

  return (
    <form action="/find" method="get" onSubmit={submit} noValidate>
      <label htmlFor={id} className={size === "lg" ? "mb-2 block text-sm font-semibold" : "sr-only"}>
        Your PIN code
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          name="pin"
          className={`input font-mono tracking-[0.2em] placeholder:font-sans placeholder:tracking-normal ${size === "lg" ? "text-lg" : ""}`}
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="e.g. 413102"
          maxLength={8}
          value={value}
          onChange={(e) => {
            setValue(e.target.value.replace(/[^\d\s]/g, ""));
            setError(null);
            setPending(false);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button type="submit" className={`btn btn-primary ${size === "lg" ? "min-h-12 px-6" : ""}`} disabled={pending}>
          {pending ? "Finding…" : "Find"}
        </button>
      </div>
      <p id={`${id}-error`} role="alert" className="mt-2 min-h-5 text-sm text-rose-700 dark:text-rose-300">
        {error}
      </p>
    </form>
  );
}
