// The shapes the API returns (see backend/app/schemas.py).

export type Source = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  published_on: string | null;
  note: string | null;
};

export type Fact = {
  label: string;
  value: string;
  as_of: string | null;
  source: Source;
};

export type Representative = {
  id: string;
  name: string;
  party: string;
  elected_in: string;
  // null when the source is a member list, which says who sits now but not when they were elected
  elected_on: string | null;
  source: Source;
  facts: Fact[];
  // Lok Sabha MPs only: questions, attendance and MPLADS fund, each with the average for all MPs
  record: MemberRecord | null;
};

export type MemberRecord = {
  as_of: string;
  questions: number;
  questions_average: number;
  questions_source: Source;
  // null when no attendance is recorded: ministers and the Speaker don't sign the register
  days_signed: number | null;
  sitting_days: number | null;
  attendance_average: number; // percent
  attendance_source: Source;
  // null when the MP isn't matched on the MPLADS dashboard
  fund_allocated: number | null; // rupees
  fund_spent: number | null;
  works_recommended: number | null;
  works_sanctioned: number | null;
  works_completed: number | null;
  fund_spent_average: number; // percent of the allocation spent
  fund_source: Source;
};

export type House = "lok_sabha" | "vidhan_sabha";

export type Seat = {
  id: string;
  house: House;
  name: string;
  state: string;
  reserved_for: string | null;
  partial: boolean;
  representative: Representative | null;
  vacancy: string | null;
};

export type SeatListItem = {
  id: string;
  house: House;
  name: string;
  state: string;
  reserved_for: string | null;
  member: string | null;
  party: string | null;
};

export type StateSeats = { state: string; seats: SeatListItem[] };

export type SeatPage = {
  seat: Seat;
  source: Source;
  pins: PlaceBrief[];
  pins_sources: Source[];
};

export type Place = {
  pin: string;
  area: string;
  district: string;
  state: string;
  source: Source;
  seats_source: Source;
  seats: Seat[];
  missing: House[];
};

export type PlaceBrief = {
  pin: string;
  area: string;
  district: string;
  state: string;
};

export type PlaceSearch = {
  places: PlaceBrief[];
  seats: {
    id: string;
    house: House;
    name: string;
    state: string;
    pins: string[];
  }[];
};

export type Coverage = {
  pincodes: number;
  seats: number;
  lok_sabha_seats: number;
  states: string[];
  examples: PlaceBrief[];
  ai_enabled: boolean;
};

export type ActBrief = {
  id: string;
  title: string;
  short_name: string;
  year: number;
  citation: string;
  unit: "Article" | "Section";
  summary: string;
  section_count: number;
};

export type Section = {
  number: string;
  anchor: string;
  title: string;
  summary: string;
  official_text: string | null;
};

export type Act = ActBrief & { source: Source; sections: Section[] };

export type SearchHit = {
  act_id: string;
  act_short_name: string;
  unit: "Article" | "Section";
  number: string;
  anchor: string;
  title: string;
  snippet: string;
};

export type SearchResults = {
  query: string;
  total: number;
  results: SearchHit[];
};

export type AssistantInfo = {
  ai_enabled: boolean;
  samples: { id: string; question: string }[];
};

/** A section the assistant read and cited. */
export type Citation = {
  key: string;
  act_id: string;
  act_short_name: string;
  unit: "Article" | "Section";
  number: string;
  title: string;
  anchor: string;
};

export type StepFound = Pick<Citation, "act_id" | "act_short_name" | "unit" | "number" | "title">;

/** One event of the assistant's answer stream (see backend app/services/assistant.py). */
export type AssistantEvent =
  | { type: "start"; mode: "ai" | "demo" | "off"; question: string }
  | {
      type: "step";
      tool: "search_laws" | "read_section" | "find_representatives" | "prepare_rti_request";
      label: string;
      detail?: string;
      found?: StepFound[];
      pin?: string;
      link?: string;
      error: boolean;
    }
  | {
      type: "answer";
      mode: "ai" | "demo";
      text: string;
      citations: Citation[];
      dropped: number;
      rti_link: string | null;
    }
  | { type: "off"; message: string }
  | { type: "error"; message: string }
  | { type: "done" };

export type StepEvent = Extract<AssistantEvent, { type: "step" }>;
export type AnswerEvent = Extract<AssistantEvent, { type: "answer" }>;

export type OldSection = {
  code: string;
  code_short_name: string;
  number: string;
  new_act_id: string;
  new_act_short_name: string;
  new_number: string | null;
  title: string;
  note: string | null;
  anchor: string | null;
};

export type OldCode = {
  code: string;
  name: string;
  short_name: string;
  new_act_id: string;
  new_act_short_name: string;
  new_act_title: string;
  source: Source;
  sections: OldSection[];
};

export type OldLookup = {
  query: string;
  numbers: string[];
  matches: OldSection[];
  sources: Source[];
};

export type ModeStats = {
  mode: "ai" | "demo";
  runs: number;
  answered: number;
  failed: number;
  citations: number;
  dropped: number;
  first_run: string | null;
};

export type Accuracy = { modes: ModeStats[] };

export type Dataset = {
  id: string;
  title: string;
  description: string;
  columns: string[];
  rows: number;
};
