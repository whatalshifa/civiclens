"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-2 text-3xl font-extrabold">We couldn&apos;t load this page</h1>
      <p className="mt-3 text-muted">
        The CivicLens server may be waking up after a quiet spell, which can take up to a minute. Please try again.
      </p>
      <button type="button" onClick={reset} className="btn btn-primary mt-6">
        Try again
      </button>
    </div>
  );
}
