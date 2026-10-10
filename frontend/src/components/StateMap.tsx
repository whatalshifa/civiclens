import Link from "next/link";

import { slugify } from "@/lib/format";
import type { StateSeats } from "@/lib/types";

/**
 * Where each state and union territory sits on the tile map: a column (1 to 9) and row on a 9 by 7 grid,
 * roughly where it is on a map of India, so people can find their state by looking. Every state
 * gets the same size of tile; the shade only shows how many Lok Sabha seats it has.
 */
const TILES: Record<string, { code: string; col: number; row: number }> = {
  "Jammu and Kashmir": { code: "JK", col: 3, row: 0 },
  Ladakh: { code: "LA", col: 4, row: 0 },
  Chandigarh: { code: "CH", col: 2, row: 1 },
  Punjab: { code: "PB", col: 3, row: 1 },
  "Himachal Pradesh": { code: "HP", col: 4, row: 1 },
  Uttarakhand: { code: "UK", col: 5, row: 1 },
  Sikkim: { code: "SK", col: 7, row: 1 },
  "Arunachal Pradesh": { code: "AR", col: 9, row: 1 },
  Rajasthan: { code: "RJ", col: 2, row: 2 },
  Haryana: { code: "HR", col: 3, row: 2 },
  Delhi: { code: "DL", col: 4, row: 2 },
  "Uttar Pradesh": { code: "UP", col: 5, row: 2 },
  Bihar: { code: "BR", col: 6, row: 2 },
  "West Bengal": { code: "WB", col: 7, row: 2 },
  Assam: { code: "AS", col: 8, row: 2 },
  Nagaland: { code: "NL", col: 9, row: 2 },
  Gujarat: { code: "GJ", col: 2, row: 3 },
  "Madhya Pradesh": { code: "MP", col: 3, row: 3 },
  Chhattisgarh: { code: "CG", col: 4, row: 3 },
  Jharkhand: { code: "JH", col: 5, row: 3 },
  Meghalaya: { code: "ML", col: 8, row: 3 },
  Manipur: { code: "MN", col: 9, row: 3 },
  "Dadra and Nagar Haveli and Daman and Diu": { code: "DH", col: 1, row: 4 },
  Maharashtra: { code: "MH", col: 2, row: 4 },
  Telangana: { code: "TG", col: 3, row: 4 },
  Odisha: { code: "OD", col: 4, row: 4 },
  Tripura: { code: "TR", col: 8, row: 4 },
  Mizoram: { code: "MZ", col: 9, row: 4 },
  Goa: { code: "GA", col: 2, row: 5 },
  Karnataka: { code: "KA", col: 3, row: 5 },
  "Andhra Pradesh": { code: "AP", col: 4, row: 5 },
  Lakshadweep: { code: "LD", col: 1, row: 6 },
  Kerala: { code: "KL", col: 2, row: 6 },
  "Tamil Nadu": { code: "TN", col: 3, row: 6 },
  Puducherry: { code: "PY", col: 4, row: 6 },
  "Andaman and Nicobar Islands": { code: "AN", col: 6, row: 6 },
};

// Four shades of teal, light to dark. Text on each passes WCAG AA (ink on the light two, 14:1 and
// up; white on the dark two, 5.5:1 and up).
const SHADES = [
  { upTo: 5, className: "border-teal-300 bg-teal-50 text-[#111816]" },
  { upTo: 15, className: "border-teal-300 bg-teal-200 text-[#111816]" },
  { upTo: 30, className: "border-teal-700 bg-teal-700 text-white" },
  { upTo: Infinity, className: "border-teal-900 bg-teal-900 text-white" },
];

export function StateMap({ states }: { states: StateSeats[] }) {
  const placed = states.filter((s) => TILES[s.state]);
  // A state the map doesn't know yet still gets listed, below the grid, so nothing goes missing.
  const unplaced = states.filter((s) => !TILES[s.state]);
  return (
    <figure>
      <nav aria-label="Lok Sabha seats by state">
        <ul className="grid grid-cols-9 gap-1 sm:gap-1.5" style={{ gridTemplateRows: "repeat(7, minmax(0, 1fr))" }}>
          {placed.map((s) => {
            const tile = TILES[s.state];
            const shade = SHADES.find((x) => s.seats.length <= x.upTo)!;
            return (
              <li key={s.state} style={{ gridColumn: tile.col, gridRow: tile.row + 1 }}>
                <Link
                  href={`/seats#${slugify(s.state)}`}
                  aria-label={`${s.state}, ${s.seats.length} ${s.seats.length === 1 ? "seat" : "seats"}`}
                  title={s.state}
                  className={`flex aspect-square flex-col items-center justify-center rounded-sm border leading-none transition-transform hover:scale-110 hover:shadow-md ${shade.className}`}
                >
                  <span className="font-display text-[0.62rem] font-bold [font-stretch:80%] sm:text-sm">{tile.code}</span>
                  <span className="mt-0.5 font-mono text-[0.55rem] sm:text-[0.7rem]">{s.seats.length}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        {unplaced.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2 text-sm">
            {unplaced.map((s) => (
              <li key={s.state}>
                <Link href={`/seats#${slugify(s.state)}`} className="chip text-xs">
                  {s.state} <span className="font-mono">{s.seats.length}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span>Tap a state to see its seats. The darker the tile, the more seats it has.</span>
        <span className="flex items-center gap-1.5" aria-hidden>
          {["1–5", "6–15", "16–30", "31+"].map((label, i) => (
            <span key={label} className="flex items-center gap-1">
              <span className={`inline-block h-3 w-3 rounded-sm border ${SHADES[i].className}`} />
              <span className="font-mono">{label}</span>
            </span>
          ))}
        </span>
      </figcaption>
    </figure>
  );
}
