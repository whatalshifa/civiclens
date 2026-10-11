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
      <div aria-hidden className="absolute inset-0 translate-x-3 translate-y-3 border-2 border-rule bg-sunken sm:translate-x-4 sm:translate-y-4" />
      <div className="relative border-2 border-rule bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-rule px-5 py-3 sm:px-8">
          <p className="kicker">Example draft</p>
          <div role="radiogroup" aria-label="Language of the letter" className="flex border-2 border-rule">
            {(["en", "hi"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                role="radio"
                aria-checked={language === lang}
                onClick={() => setLanguage(lang)}
                className="h-8 px-3 text-sm font-bold text-foreground first:border-r-2 first:border-rule aria-checked:bg-primary aria-checked:text-primary-ink"
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
          className="max-h-[26rem] overflow-y-auto px-5 py-6 text-[0.9375rem] leading-relaxed whitespace-pre-wrap sm:max-h-[30rem] sm:px-8 sm:py-7"
        >
          {language === "en" ? english : hindi}
        </div>
      </div>
    </div>
  );
}
