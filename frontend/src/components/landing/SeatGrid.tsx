import type { StateSeats } from "@/lib/types";

/**
 * Every Lok Sabha seat as one square, in state order (states alternate between two tints so the
 * runs show), with vacant seats drawn hollow. No party, no colour by result: the only thing it
 * shows is that every seat is there and who holds one.
 */
export function SeatGrid({ states, columns = 27 }: { states: StateSeats[]; columns?: number }) {
  const cell = 14;
  const gap = 4;
  const seats = states.flatMap((s, i) => s.seats.map((seat) => ({ ...seat, tint: i % 2 })));
  const rows = Math.ceil(seats.length / columns);
  const width = columns * (cell + gap) - gap;
  const height = rows * (cell + gap) - gap;
  const vacant = seats.filter((s) => !s.member);
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${seats.length} squares, one for each Lok Sabha seat, grouped by state. ${vacant.length} are vacant: ${vacant.map((s) => `${s.name} (${s.state})`).join(", ")}.`}
      className="h-auto w-full"
    >
      {seats.map((seat, i) => {
        const x = (i % columns) * (cell + gap);
        const y = Math.floor(i / columns) * (cell + gap);
        return seat.member ? (
          <rect key={seat.id} x={x} y={y} width={cell} height={cell} rx={2} className={seat.tint ? "fill-teal-300" : "fill-teal-500"}>
            <title>{`${seat.name}, ${seat.state}`}</title>
          </rect>
        ) : (
          <rect
            key={seat.id}
            x={x + 1}
            y={y + 1}
            width={cell - 2}
            height={cell - 2}
            rx={2}
            className="fill-none stroke-amber-300"
            strokeWidth={2}
          >
            <title>{`${seat.name}, ${seat.state}: vacant`}</title>
          </rect>
        );
      })}
    </svg>
  );
}
