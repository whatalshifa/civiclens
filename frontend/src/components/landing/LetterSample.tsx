"use client";

import { useState } from "react";

/**
 * A real draft from the RTI drafter (built by lib/rti.ts from example answers), with the same
 * English and Hindi switch the drafter has. Nothing here is sent anywhere.
 */
export function LetterSample({ english, hindi }: { english: string; hindi: string }) {
  const [language, setLanguage] = useState<"en" | "hi">("en");
  return (
    <div className="relative">
      {/* The second sheet behind, so it reads as paper on a desk. */}
      <div aria-hidden className="absolute inset-0 translate-x-3 translate-y-3 rotate-[1.5deg] rounded-md border border-line bg-surface sm:translate-x-5 sm:translate-y-4" />
      <div className="relative rounded-md border border-line bg-surface shadow-[0_24px_50px_-28px_rgba(4,47,46,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3 sm:px-8">
          <p className="kicker text-muted">Example draft</p>
          <div role="radiogroup" aria-label="Language of the letter" className="flex gap-0.5 rounded-lg border border-line bg-surface p-0.5">
            {(["en", "hi"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                role="radio"
                aria-checked={language === lang}
                onClick={() => setLanguage(lang)}
                className="btn btn-sm rounded-md text-muted aria-checked:bg-teal-800 aria-checked:text-white"
                lang={lang}
              >
                {lang === "en" ? "English" : "हिंदी"}
              </button>
            ))}
          </div>
        </div>
        <div
          role="region"
          aria-label="Letter preview"
          tabIndex={0}
          lang={language}
          className="max-h-[26rem] overflow-y-auto px-5 py-6 font-serif text-[0.9375rem] leading-relaxed whitespace-pre-wrap sm:max-h-[30rem] sm:px-8 sm:py-7"
        >
          {language === "en" ? english : hindi}
        </div>
      </div>
    </div>
  );
}
