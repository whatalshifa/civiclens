"use client";

import { useEffect } from "react";

/**
 * Keeps a one-pane-at-a-time view ([data-panes], see globals.css) in step with the address's
 * #fragment. CSS :target does this on its own without JavaScript, but it misses addresses changed
 * by the router (a link from another page to /laws/bnss-2023#s-173), so once scripts run this
 * takes over: it marks the pane on show, marks the links to it as current, and scrolls it into view.
 */
export function PaneSwitcher({ id, align = "start" }: { id: string; align?: ScrollLogicalPosition }) {
  useEffect(() => {
    const root = document.getElementById(id);
    if (!root) return;
    let last = "";
    const panes = () => Array.from(root.querySelectorAll<HTMLElement>("[data-pane]"));

    function sync(scroll: boolean) {
      if (!root) return;
      last = window.location.hash;
      const hash = decodeURIComponent(last.slice(1));
      const target = hash ? document.getElementById(hash) : null;
      const picked = target && root.contains(target) ? target.closest<HTMLElement>("[data-pane]") : null;
      const all = panes();
      const shown = picked ?? all.find((p) => p.hasAttribute("data-default")) ?? all[0];
      for (const pane of all) pane.toggleAttribute("data-shown", pane === shown);
      root.toggleAttribute("data-picked", !!picked && !picked.hasAttribute("data-default"));
      root.setAttribute("data-live", "");
      for (const link of root.querySelectorAll<HTMLAnchorElement>("a[data-pane-link]")) {
        if (shown && link.hash === `#${shown.id}`) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
      if (scroll && target && picked) target.scrollIntoView({ block: align });
    }

    sync(true);
    const onHash = () => sync(true);
    // The router changes the address without a hashchange event for links within the page it is on.
    const onClick = () =>
      window.setTimeout(() => {
        if (window.location.hash !== last) sync(true);
      }, 0);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onHash);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onHash);
      document.removeEventListener("click", onClick);
    };
  }, [id, align]);
  return null;
}
