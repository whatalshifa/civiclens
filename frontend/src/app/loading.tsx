/** Shown while a page waits for the API. On free hosting the first request after a quiet spell is slow. */
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="max-w-3xl">
      <span className="sr-only">Loading…</span>
      <div className="skeleton h-4 w-28" />
      <div className="skeleton mt-4 h-9 w-2/3" />
      <div className="skeleton mt-3 h-4 w-1/2" />
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="skeleton h-56" />
        <div className="skeleton h-56" />
      </div>
      <p className="mt-6 text-sm text-muted">
        Loading. If CivicLens hasn&apos;t been used for a while, the server takes up to a minute to wake up.
      </p>
    </div>
  );
}
