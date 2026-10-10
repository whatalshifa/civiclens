"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Answer } from "@/components/assistant/Answer";
import { Steps } from "@/components/assistant/Steps";
import { readEvents } from "@/lib/sse";
import type { AnswerEvent, AssistantEvent, AssistantInfo, StepEvent } from "@/lib/types";

type Run = {
  question: string;
  mode?: "ai" | "demo" | "off";
  steps: StepEvent[];
  answer?: AnswerEvent;
  off?: string;
  error?: string;
  running: boolean;
};

/** Folds the stream of events into what the page shows. */
export function apply(run: Run, event: AssistantEvent): Run {
  switch (event.type) {
    case "start":
      return { ...run, question: event.question, mode: event.mode };
    case "step":
      return { ...run, steps: [...run.steps, event] };
    case "answer":
      return { ...run, answer: event };
    case "off":
      return { ...run, off: event.message };
    case "error":
      return { ...run, error: event.message };
    case "done":
      return { ...run, running: false };
  }
}

export function runFromEvents(events: AssistantEvent[]): Run {
  return events.reduce(apply, { question: "", steps: [], running: false });
}

export function Assistant({
  info,
  initial,
  initialSample,
}: {
  info: AssistantInfo;
  initial?: AssistantEvent[];
  initialSample?: string;
}) {
  const [question, setQuestion] = useState("");
  const [run, setRun] = useState<Run | null>(initial ? runFromEvents(initial) : null);
  const [activeSample, setActiveSample] = useState(initialSample);
  const abort = useRef<AbortController | null>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => () => abort.current?.abort(), []);

  const finished = run && !run.running;
  useEffect(() => {
    if (finished && run?.answer) resultHeading.current?.focus({ preventScroll: true });
  }, [finished, run?.answer]);

  async function ask(text: string, sample?: string) {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setActiveSample(sample);
    setRun({ question: text, steps: [], running: true });
    requestAnimationFrame(() => resultHeading.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    // A sample gets its own address, so it can be shared; a typed question stays private.
    window.history.replaceState(null, "", sample ? `/assistant?sample=${sample}` : "/assistant");

    try {
      const response = await fetch("/assistant/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sample ? { question: text, sample } : { question: text }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        let detail = "Something went wrong. Please try again.";
        try {
          const data = await response.json();
          if (typeof data.detail === "string") detail = data.detail;
        } catch {}
        setRun((r) => r && { ...r, error: detail, running: false });
        return;
      }
      for await (const event of readEvents(response.body)) {
        setRun((r) => r && apply(r, event));
      }
      setRun((r) => r && { ...r, running: false });
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error(err);
      setRun(
        (r) =>
          r && {
            ...r,
            error: "The connection dropped before the answer finished. Please try again.",
            running: false,
          },
      );
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = question.trim();
    if (text.length < 3 || run?.running) return;
    ask(text);
  }

  return (
    <div>
      <form onSubmit={onSubmit} aria-label="Ask the rights assistant">
        <label htmlFor="assistant-q" className="field-label">
          Describe your situation or ask a question
        </label>
        <textarea
          id="assistant-q"
          className="input min-h-28 resize-y py-3 leading-relaxed"
          placeholder="e.g. My landlord won't return my deposit. What can I do?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
          }}
          maxLength={600}
          required
          minLength={3}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {info.ai_enabled
              ? "Don't include names, phone numbers or other personal details."
              : "Demo mode: the AI is switched off, so only the sample questions get a full answer."}
          </p>
          <button type="submit" className="btn btn-primary" disabled={run?.running || question.trim().length < 3}>
            {run?.running ? "Answering…" : "Ask"}
          </button>
        </div>
      </form>

      <div className="mt-8">
        <p className="label">{info.ai_enabled ? "Or try a sample question" : "Sample questions"}</p>
        <ul className="card mt-2 divide-y divide-line overflow-hidden">
          {info.samples.map((s) => (
            <li key={s.id}>
              <a
                href={`/assistant?sample=${s.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  if (run?.running && activeSample === s.id) return;
                  setQuestion("");
                  ask(s.question, s.id);
                }}
                aria-current={activeSample === s.id ? "true" : undefined}
                className="flex items-center justify-between gap-3 px-4 py-3 text-[0.9375rem] transition-colors hover:bg-sunken aria-[current]:bg-accent-soft aria-[current]:font-medium"
              >
                {s.question}
                <ChevronRight aria-hidden className="h-4 w-4 shrink-0 text-muted" />
              </a>
            </li>
          ))}
        </ul>
      </div>

      {run && <Result run={run} headingRef={resultHeading} />}
    </div>
  );
}

export function Result({ run, headingRef }: { run: Run; headingRef?: React.Ref<HTMLHeadingElement> }) {
  return (
    <section className="card mt-10 p-5 sm:p-7" aria-labelledby="result-heading" aria-busy={run.running}>
      <p className="eyebrow">{run.mode === "demo" ? "Sample answer" : "Your question"}</p>
      <h2
        id="result-heading"
        ref={headingRef}
        tabIndex={-1}
        className="mt-2 text-xl font-semibold text-balance outline-none"
      >
        {run.question}
      </h2>

      {(run.steps.length > 0 || run.running) && (
        <details className="group mt-6" open={run.running || !run.answer}>
          <summary className="cursor-pointer list-none text-sm font-semibold text-muted [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-1.5">
              <ChevronRight aria-hidden className="h-4 w-4 transition-transform group-open:rotate-90" />
              {run.running
                ? "Searching and reading the law"
                : `How this was answered: ${run.steps.length} step${run.steps.length === 1 ? "" : "s"}`}
            </span>
          </summary>
          <div className="mt-4">
            <Steps steps={run.steps} working={run.running && !run.answer} />
          </div>
        </details>
      )}

      <div aria-live="polite">
        {run.answer && (
          <div className="mt-7 border-t border-line pt-6">
            <Answer answer={run.answer} />
          </div>
        )}

        {run.off && (
          <div className="note mt-6">
            <p>{run.off}</p>
            <p className="mt-2">
              <Link href={`/laws/search?q=${encodeURIComponent(run.question.slice(0, 200))}`} className="link">
                See all matching sections
              </Link>
            </p>
          </div>
        )}

        {run.error && (
          <p
            role="alert"
            className="mt-6 rounded-lg border border-rose-300/60 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-100"
          >
            {run.error}
          </p>
        )}
      </div>
    </section>
  );
}
