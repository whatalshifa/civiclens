"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Seconds before each automatic retry, and how many automatic retries one address gets. */
const WAIT_SECONDS = 15;
const AUTO_RETRIES = 3;

// Kept outside the component: a failed retry mounts this component afresh, and the count must
// survive that so a page that is really broken stops retrying.
const triesByAddress = new Map<string, number>();

/**
 * What a page shows when it couldn't be loaded. Almost always the free-tier API is waking up after
 * a quiet spell (about 50 seconds), so it says so calmly, counts down, and retries on its own a
 * few times before suggesting the visitor try later or report it.
 */
export function ErrorState({ retry }: { retry: () => void }) {
  const [tries, setTries] = useState(0);
  const [seconds, setSeconds] = useState(WAIT_SECONDS);
  const givenUp = tries >= AUTO_RETRIES;

  useEffect(() => {
    const address = window.location.pathname + window.location.search;
    const done = triesByAddress.get(address) ?? 0;
    // The count lives outside React (see above), so it can only be read once mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTries(done);
    if (done >= AUTO_RETRIES) return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      const left = WAIT_SECONDS - Math.floor((Date.now() - started) / 1000);
      setSeconds(Math.max(left, 0));
      if (left <= 0) {
        window.clearInterval(timer);
        triesByAddress.set(address, done + 1);
        retry();
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retry]);

  function tryNow() {
    const address = window.location.pathname + window.location.search;
    triesByAddress.set(address, (triesByAddress.get(address) ?? 0) + 1);
    retry();
  }

  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <p className="eyebrow">{givenUp ? "Still not loading" : "Waking up"}</p>
      <h1 className="mt-2 page-title">We couldn&apos;t load this page</h1>
      {givenUp ? (
        <p className="mt-3 text-muted">
          The CivicLens server isn&apos;t answering. It may be down for a moment; please try again in a few minutes,
          or{" "}
          <a href="https://github.com/whatalshifa/civiclens/issues" className="link">
            report it
          </a>
          .
        </p>
      ) : (
        <>
          <p className="mt-3 text-muted">
            CivicLens runs on a free server that sleeps when nobody is using it, and takes about a minute to wake up.
          </p>
          <p className="mt-3 font-mono text-sm text-muted" aria-hidden>
            {seconds > 0 ? `Trying again in ${seconds}s` : "Trying again…"}
          </p>
          <p className="sr-only" role="status">
            We&apos;ll try again automatically in {WAIT_SECONDS} seconds.
          </p>
        </>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={tryNow} className="btn btn-primary">
          Try again now
        </button>
        <Link href="/" className="btn btn-secondary">
          Go to the home page
        </Link>
      </div>
    </div>
  );
}
