"use client";

import { useState } from "react";

type Language = "en" | "hi";

/**
 * The live preview of a drafted letter, with print, download and copy. Everything happens in the
 * browser: the letter is never sent to CivicLens.
 */
export function LetterPreview({
  title,
  letter,
  filename,
  todo,
  language,
  onLanguage,
  children,
}: {
  title: string;
  letter: string;
  filename: string;
  todo: string[];
  language?: Language;
  onLanguage?: (language: Language) => void;
  children?: React.ReactNode;
}) {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const copied = copiedText === letter;

  function download() {
    const blob = new Blob([letter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(letter);
      setCopiedText(letter);
    } catch {
      setCopiedText(null);
    }
  }

  return (
    <div className="lg:sticky lg:top-20 lg:self-start">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h2 className="font-semibold">{title}</h2>
        {language && onLanguage && (
          <div
            role="radiogroup"
            aria-label="Language of the letter"
            className="flex rounded-sm border border-line bg-surface p-0.5"
          >
            {(["en", "hi"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                role="radio"
                aria-checked={language === lang}
                onClick={() => onLanguage(lang)}
                className="btn btn-sm aria-checked:bg-teal-800 aria-checked:text-white"
                lang={lang}
              >
                {lang === "en" ? "English" : "हिंदी"}
              </button>
            ))}
          </div>
        )}
      </div>

      <article
        aria-label="Letter preview"
        tabIndex={0}
        lang={language === "hi" ? "hi" : "en"}
        className="card max-h-[70vh] overflow-auto p-5 font-serif text-[0.95rem] leading-relaxed whitespace-pre-wrap sm:p-8 lg:max-h-[calc(100vh-14rem)] print:max-h-none print:overflow-visible print:border-0 print:p-0 print:shadow-none"
      >
        {letter}
      </article>

      <div className="mt-4 print:hidden">
        {todo.length > 0 && (
          <p className="mb-3 text-sm text-muted" aria-live="polite">
            Still to fill in: {todo.join(", ")}.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            Print or save as PDF
          </button>
          <button type="button" className="btn btn-secondary" onClick={download}>
            Download
          </button>
          <button type="button" className="btn btn-secondary" onClick={copy}>
            {copied ? "Copied" : "Copy text"}
          </button>
        </div>
        <p className="mt-3 text-xs text-muted">
          Everything you type stays in this browser. CivicLens never receives or stores it.
        </p>
        {children}
      </div>
    </div>
  );
}
