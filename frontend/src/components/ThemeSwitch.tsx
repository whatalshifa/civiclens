"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const KEY = "cl-theme";

/** Runs in <head> before the page paints, so a dark-mode visitor never sees a white flash. */
// Until someone picks a side, the device setting decides. It also switches to light while printing,
// so a printed explanation is never white text on white paper.
export const THEME_SCRIPT = `(()=>{var h=document.documentElement,w;h.classList.add("js");try{var t=localStorage.getItem("${KEY}");h.classList.toggle("dark",t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))}catch(e){}addEventListener("beforeprint",function(){w=h.classList.contains("dark");h.classList.remove("dark")});addEventListener("afterprint",function(){if(w)h.classList.add("dark")})})()`;

const current = (): Theme => (document.documentElement.classList.contains("dark") ? "dark" : "light");

/**
 * A two-way switch set in capitals on the dark bar, like the selector on a public display: LIGHT | DARK.
 * The side in use is filled amber. Each side is a real button that says whether it is pressed.
 */
export function ThemeSwitch({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // Read after mounting: the server can't know what the browser chose.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(current());
    const media = matchMedia("(prefers-color-scheme: dark)");
    const follow = () => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem(KEY);
      } catch {}
      if (saved) return;
      document.documentElement.classList.toggle("dark", media.matches);
      setTheme(current());
    };
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);

  function choose(next: Theme) {
    try {
      localStorage.setItem(KEY, next);
    } catch {}
    document.documentElement.classList.toggle("dark", next === "dark");
    setTheme(next);
  }

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className={`flex h-9 shrink-0 border-2 border-header-ink/70 text-[0.75rem] leading-none font-bold tracking-[0.08em] uppercase ${className}`}
      style={{ fontStretch: "75%" }}
    >
      {(["light", "dark"] as const).map((side, i) => (
        <button
          key={side}
          type="button"
          aria-pressed={theme === side}
          onClick={() => choose(side)}
          className={`px-2 uppercase sm:px-2.5 ${i ? "border-l-2 border-header-ink/70" : ""} ${
            theme === side ? "bg-signal text-signal-ink" : "text-header-ink hover:bg-white/10"
          }`}
        >
          {side}
        </button>
      ))}
    </div>
  );
}
