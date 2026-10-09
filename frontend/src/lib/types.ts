// The shapes the API returns (see backend/app/schemas.py).

export type Source = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  published_on: string | null;
  note: string | null;
};

export type Fact = { label: string; value: string; as_of: string | null; source: Source };

export type Representative = {
  id: string;
  name: string;
  party: string;
  elected_in: string;
  elected_on: string;
  source: Source;
  facts: Fact[];
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

export type PlaceBrief = { pin: string; area: string; district: string; state: string };

export type PlaceSearch = {
  places: PlaceBrief[];
  seats: { id: string; house: House; name: string; state: string; pins: string[] }[];
};

export type Coverage = {
  pincodes: number;
  seats: number;
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

export type Section = { number: string; anchor: string; title: string; summary: string; official_text: string | null };

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

export type SearchResults = { query: string; total: number; results: SearchHit[] };
