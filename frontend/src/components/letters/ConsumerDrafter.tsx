"use client";

import { useMemo, useState } from "react";

import { Check, Choice, DateField, Fieldset, TextArea, TextField, YourDetails } from "@/components/letters/form";
import { LetterPreview } from "@/components/letters/LetterPreview";
import {
  buildConsumer,
  type ConsumerDraft,
  consumerMissing,
  EMPTY_CONSUMER,
  type Remedy,
  REMEDIES,
} from "@/lib/complaints";

/** A written complaint to a seller or service provider: the step before the Consumer Commission. */
export function ConsumerDrafter({ today }: { today: string }) {
  const [draft, setDraft] = useState<ConsumerDraft>({ ...EMPTY_CONSUMER, date: today });
  const letter = useMemo(() => buildConsumer(draft), [draft]);

  function set<K extends keyof ConsumerDraft>(key: K, value: ConsumerDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function toggle(remedy: Remedy, on: boolean) {
    setDraft((d) => ({ ...d, remedies: on ? [...d.remedies, remedy] : d.remedies.filter((r) => r !== remedy) }));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10">
      <form className="space-y-8 print:hidden" onSubmit={(e) => e.preventDefault()} aria-label="Complaint details">
        <Fieldset legend="1. Who you are complaining to">
          <TextField
            label="Seller or service provider"
            value={draft.business}
            onChange={(v) => set("business", v)}
            placeholder="e.g. the shop, the company or the online store"
          />
          <TextArea
            label="Their address"
            optional
            hint="The address on the bill, or the customer care address on their website."
            value={draft.businessAddress}
            onChange={(v) => set("businessAddress", v)}
            max={300}
          />
        </Fieldset>

        <Fieldset legend="2. What happened">
          <Choice
            legend="Was it something you bought, or a service?"
            value={draft.kind}
            options={[
              { value: "goods", label: "Something I bought" },
              { value: "service", label: "A service (repair, travel, bank, internet, and so on)" },
            ]}
            onChange={(v) => set("kind", v)}
          />
          <TextField
            label="What it was"
            value={draft.product}
            onChange={(v) => set("product", v)}
            placeholder="e.g. a washing machine, model XYZ"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Order or bill number"
              optional
              value={draft.orderRef}
              onChange={(v) => set("orderRef", v)}
              max={80}
            />
            <DateField
              label="Date of purchase"
              value={draft.boughtOn}
              max={today}
              onChange={(v) => set("boughtOn", v)}
            />
            <TextField label="Amount paid (₹)" value={draft.amount} onChange={(v) => set("amount", v)} max={20} />
          </div>
          <TextArea
            label="What went wrong"
            hint="One point per line: what happened, when, and what you already tried (calls, emails, complaint numbers)."
            tall
            value={draft.problem}
            onChange={(v) => set("problem", v)}
            max={3000}
          />
        </Fieldset>

        <Fieldset legend="3. What you want">
          {(Object.keys(REMEDIES) as Remedy[]).map((r) => (
            <Check
              key={r}
              checked={draft.remedies.includes(r)}
              onChange={(on) => toggle(r, on)}
              title={REMEDIES[r].label}
            />
          ))}
          <div className="grid gap-4 sm:grid-cols-2">
            {draft.remedies.includes("compensate") && (
              <TextField
                label="Compensation asked (₹)"
                optional
                value={draft.compensation}
                onChange={(v) => set("compensation", v)}
                max={20}
              />
            )}
            <TextField
              label="Days they have to reply"
              hint="15 days is usual."
              value={draft.days}
              onChange={(v) => set("days", v)}
              max={3}
            />
          </div>
        </Fieldset>

        <YourDetails legend="4. Your details" draft={draft} set={set} />
      </form>

      <LetterPreview
        title="Your complaint"
        letter={letter}
        filename="consumer-complaint.txt"
        todo={consumerMissing(draft)}
        language={draft.language}
        onLanguage={(lang) => set("language", lang)}
      />
    </div>
  );
}
