/**
 * Shown when a page that can render without the API (the landing page, the services home) found it
 * asleep. The free-tier API takes about a minute to wake, so instead of empty maps and zeros the page
 * says so, calmly, with a plain link to reload that works without JavaScript.
 */
export function WakingNotice({ href, className = "" }: { href: string; className?: string }) {
  return (
    <div role="status" className={`border-l-[6px] border-signal bg-surface px-4 py-3 text-[0.9375rem] ${className}`}>
      <p>
        <strong className="font-bold">The data is waking up.</strong> CivicLens runs on a free server that sleeps
        when nobody is using it, and it takes about a minute to start.{" "}
        <a href={href} className="link">
          Reload this page
        </a>{" "}
        in a moment to see the seats and numbers.
      </p>
    </div>
  );
}
