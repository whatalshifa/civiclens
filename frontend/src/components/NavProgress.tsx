"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const here = () => `${window.location.pathname}?${new URLSearchParams(window.location.search)}`;

/**
 * Shows that a page is on its way after a click on a link or a search form. The free-tier API can
 * take most of a minute to wake up, and without this the click would seem to do nothing.
 *
 * This replaces a loading.tsx fallback, which would wrap every page in a Suspense boundary: then
 * the server sends pages hidden until JavaScript reveals them, and without JavaScript they never
 * appear. Pages here render completely on the server, so they work without JavaScript too.
 */
export function NavProgress() {
  const key = `${usePathname()}?${useSearchParams()}`;
  // The page we were on when a navigation started. Once the address changes, it's no longer pending.
  const [from, setFrom] = useState<string | null>(null);
  const pending = from === key;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element).closest?.("a");
      if (!link || link.target || link.hasAttribute("download") || !link.href) return;
      const url = new URL(link.href);
      if (url.origin !== window.location.origin) return;
      if (`${url.pathname}?${url.searchParams}` === here()) return; // same page, maybe another #section
      setFrom(here());
    }
    function onSubmit(e: SubmitEvent) {
      const form = e.target as HTMLFormElement;
      if (!e.defaultPrevented && form.method === "get") setFrom(here());
    }
    // Listening on the document (bubbling) runs after React's own handlers, so a link whose handler cancels
    // the navigation (the assistant's sample questions) is already marked defaultPrevented.
    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("submit", onSubmit);
    };
  }, []);

  return (
    <>
      {pending && (
        <div aria-hidden className="nav-progress fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden print:hidden">
          <div className="h-full w-1/3 bg-teal-600" />
        </div>
      )}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
      >
        {pending && (
          <p className="nav-progress-note card px-4 py-2.5 text-sm text-muted shadow-lg">
            Loading. If CivicLens hasn&apos;t been used for a while, the server takes up to a minute to wake up.
          </p>
        )}
      </div>
    </>
  );
}
