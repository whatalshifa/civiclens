"use client";

import { useMemo, useState } from "react";

import { DateField, Fieldset, TextArea, TextField, YourDetails } from "@/components/letters/form";
import { LetterPreview } from "@/components/letters/LetterPreview";
import { buildPolice, EMPTY_POLICE, type PoliceDraft, policeMissing } from "@/lib/complaints";

/** A complaint to the Superintendent of Police when a police station won't register an FIR. */
export function PoliceDrafter({ today }: { today: string }) {
  const [draft, setDraft] = useState<PoliceDraft>({ ...EMPTY_POLICE, date: today });
  const letter = useMemo(() => buildPolice(draft), [draft]);

  function set<K extends keyof PoliceDraft>(key: K, value: PoliceDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10">
      <form className="space-y-8 print:hidden" onSubmit={(e) => e.preventDefault()} aria-label="Complaint details">
        <Fieldset legend="1. Where it goes">
          <TextField
            label="District"
            hint="The Superintendent of Police of the district where it happened. In a city with a Police Commissioner, write to the Commissioner's office instead."
            value={draft.district}
            onChange={(v) => set("district", v)}
            max={80}
          />
          <TextField
            label="Police station that refused"
            value={draft.station}
            onChange={(v) => set("station", v)}
            max={120}
          />
          <DateField label="Date you went there" value={draft.wentOn} max={today} onChange={(v) => set("wentOn", v)} />
          <TextArea
            label="What the police said"
            optional
            hint="For example, who you spoke to and the reason they gave."
            value={draft.refusal}
            onChange={(v) => set("refusal", v)}
          />
        </Fieldset>

        <Fieldset legend="2. What happened">
          <div className="grid gap-4 sm:grid-cols-2">
            <DateField label="Date" value={draft.happenedOn} max={today} onChange={(v) => set("happenedOn", v)} />
            <TextField label="Place" value={draft.happenedAt} onChange={(v) => set("happenedAt", v)} max={160} />
          </div>
          <TextArea
            label="What happened"
            hint="Facts only, in order: what was done, by whom, and any loss or injury."
            tall
            value={draft.details}
            onChange={(v) => set("details", v)}
            max={4000}
          />
          <TextField
            label="Who did it"
            optional
            hint="Names, or a description if you don't know them."
            value={draft.accused}
            onChange={(v) => set("accused", v)}
            max={300}
          />
          <TextField
            label="Witnesses"
            optional
            value={draft.witnesses}
            onChange={(v) => set("witnesses", v)}
            max={300}
          />
        </Fieldset>

        <YourDetails legend="3. Your details" draft={draft} set={set} />
      </form>

      <LetterPreview
        title="Your complaint"
        letter={letter}
        filename="police-complaint.txt"
        todo={policeMissing(draft)}
        language={draft.language}
        onLanguage={(lang) => set("language", lang)}
      />
    </div>
  );
}
