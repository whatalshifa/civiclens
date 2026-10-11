"use client";

import { BarTop } from "@/components/Bar";
import { ErrorState } from "@/components/ErrorState";

/**
 * For the landing page, which has no frame of its own above this boundary: the brand's bar, then
 * the same calm "waking up" message as the service. (The service's pages use (app)/error.tsx.)
 */
export default function RootError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <>
      <header className="bg-header text-header-ink">
        <BarTop href="/" label="CivicLens home">
          {null}
        </BarTop>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">
        <ErrorState retry={retry} />
      </main>
    </>
  );
}
