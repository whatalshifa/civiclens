/**
 * The CivicLens emblem: a lens seen face-on, with a ring of 24 index ticks round it like the bezel
 * of a measuring instrument. No spokes, no hub, no lions: it is the product's own mark, not a
 * government emblem. The lens is civic amber; the ring and ticks take the text colour.
 */
const TICKS = Array.from({ length: 24 }, (_, i) => i * 15);

function EmblemShapes() {
  return (
    <>
      {/* The outer ring, cut with even-odd so it is a band. */}
      <path fillRule="evenodd" fill="currentColor" d="M24 1a23 23 0 1 1 0 46a23 23 0 1 1 0-46Z M24 4.5a19.5 19.5 0 1 0 0 39a19.5 19.5 0 1 0 0-39Z" />
      {TICKS.map((deg) => (
        <rect
          key={deg}
          x={deg % 90 === 0 ? 22.9 : 23.15}
          y={deg % 90 === 0 ? 6.5 : 7}
          width={deg % 90 === 0 ? 2.2 : 1.7}
          height={deg % 90 === 0 ? 5 : 3.5}
          fill="currentColor"
          transform={`rotate(${deg} 24 24)`}
        />
      ))}
      {/* The lens, with its glint cut out. */}
      <path
        fillRule="evenodd"
        fill="var(--signal)"
        d="M24 14a10 10 0 1 1 0 20a10 10 0 1 1 0-20Z M18.6 22.6a5.6 5.6 0 0 1 4-4l0.7 2.4a3.1 3.1 0 0 0-2.3 2.3Z"
      />
    </>
  );
}

export function Emblem({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden focusable="false" className={className}>
      <EmblemShapes />
    </svg>
  );
}

/**
 * The emblem inside a stamped seal band, for large sizes only: the footer and the brand sheet.
 * `knockout` is the colour of whatever the seal sits on; the lettering is cut out of the band in it.
 */
export function Seal({ className = "h-28 w-28", knockout = "var(--background)" }: { className?: string; knockout?: string }) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden focusable="false" className={className}>
      <defs>
        <path id="cl-seal-path" d="M60 60m-45 0a45 45 0 1 1 90 0a45 45 0 1 1-90 0" />
      </defs>
      <path fillRule="evenodd" fill="currentColor" d="M60 2a58 58 0 1 1 0 116a58 58 0 1 1 0-116Z M60 19a41 41 0 1 0 0 82a41 41 0 1 0 0-82Z" />
      <text
        fill={knockout}
        style={{ fontSize: 13, fontWeight: 800, fontStretch: "75%" }}
      >
        <textPath href="#cl-seal-path" textLength={281} lengthAdjust="spacing">
          CIVICLENS · INDIA · CIVICLENS · INDIA ·
        </textPath>
      </text>
      <g transform="translate(28 28) scale(1.333)">
        <EmblemShapes />
      </g>
    </svg>
  );
}

/**
 * The emblem and the condensed-capitals wordmark. `tone="bar"` is for the dark-teal bar (white and
 * amber); `tone="page"` is for the page itself (ink and teal).
 */
export function Logo({ tone = "bar", compact = false }: { tone?: "bar" | "page"; compact?: boolean }) {
  const bar = tone === "bar";
  return (
    <span className={`flex items-center gap-2 sm:gap-2.5 ${bar ? "text-header-ink" : "text-foreground"}`}>
      <Emblem className={compact ? "h-8 w-8" : "h-8 w-8 sm:h-10 sm:w-10"} />
      <span
        className={`leading-none font-black tracking-[0.06em] uppercase ${compact ? "text-[1.25rem]" : "text-[1.25rem] sm:text-[1.625rem]"}`}
        style={{ fontStretch: "68%" }}
      >
        Civic<span className={bar ? "text-signal" : "text-accent"}>Lens</span>
      </span>
    </span>
  );
}
