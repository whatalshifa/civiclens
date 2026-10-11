/**
 * CivicLens pictograms, drawn for this site in the manner of public signage and ISOTYPE: solid
 * geometric shapes on a 24-unit grid, filled with the current text colour, square ends, no strokes.
 * Detail is cut out of the shape (even-odd fill) rather than drawn on top, so each one reads as a
 * single silhouette at 16px. They are decoration: whatever they sit beside carries the meaning.
 */
type Props = { className?: string };

/** `d` is cut with the even-odd rule (overlaps become holes); `solid` is drawn on top as it is. */
function Glyph({ className = "h-5 w-5", d, solid }: Props & { d: string; solid?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false" className={className} fill="currentColor">
      <path d={d} fillRule="evenodd" />
      {solid && <path d={solid} />}
    </svg>
  );
}

/** A standing figure: the citizen, the voter, the representative. */
export const IconPerson = (p: Props) => (
  <Glyph {...p} d="M12 1.5a3.25 3.25 0 1 1 0 6.5a3.25 3.25 0 1 1 0-6.5Z M6.5 9h11l1.75 8H16.5v5.5h-3V17h-3v5.5h-3V17H4.75Z" />
);

/** Two figures, for "everyone gets the same fields". */
export const IconPeople = (p: Props) => (
  <Glyph
    {...p}
    d="M7.5 3a2.75 2.75 0 1 1 0 5.5a2.75 2.75 0 1 1 0-5.5Z M3 9.5h9l1.5 6.5h-2v6H9v-4.5H6V22H3.5v-6h-2Z M16.5 5a2.25 2.25 0 1 1 0 4.5a2.25 2.25 0 1 1 0-4.5Z M14 10.5h5.5L22.5 16h-2v6h-2.25v-4.5h-1.5V22H14.5Z"
  />
);

/** A sheet with a folded corner and three lines of text cut out of it. */
export const IconDocument = (p: Props) => (
  <Glyph {...p} d="M4 1.5h9.5V8H20v14.5H4Z M15 1.5L20 6.5H15Z M7 11h10v2H7Z M7 15h10v2H7Z M7 19h6v1.75H7Z" />
);

/** The scales of justice: a solid post and beam, two hanging pans. */
export const IconScales = (p: Props) => (
  <Glyph
    {...p}
    d="M12 2a1.75 1.75 0 1 1 0 3.5a1.75 1.75 0 1 1 0-3.5Z M11 7.5h2V19h-2Z M2.5 5.5h19v2h-19Z M7 19h10v3.5H7Z M5 7.5l3.6 6.5H7.1L5 10.2L2.9 14H1.4Z M1 14h8a4 4 0 0 1-8 0Z M19 7.5l3.6 6.5h-1.5L19 10.2L16.9 14h-1.5Z M15 14h8a4 4 0 0 1-8 0Z"
  />
);

/** A ballot box with a paper going in. */
export const IconBallot = (p: Props) => (
  <Glyph {...p} d="M8 1.5h8V10H8Z M2.5 10h19v12.5h-19Z M6.5 12h11v2h-11Z M9.5 4.5l1.3-1.3l1.2 1.2l2.4-2.4l1.3 1.3L12 7Z" />
);

/** A columned public building: pediment, four pillars, a plinth. */
export const IconBuilding = (p: Props) => (
  <Glyph {...p} d="M12 1.5L22.5 7v2.5h-21V7Z M3.5 11h3v7.5h-3Z M8.5 11h3v7.5h-3Z M12.5 11h3v7.5h-3Z M17.5 11h3v7.5h-3Z M1.5 19.5h21v3h-21Z" />
);

/** An envelope with its flap cut out as a V. */
export const IconLetter = (p: Props) => (
  <Glyph {...p} d="M1.5 4h21v16h-21Z M3.5 6h2.6L12 10.4L17.9 6h2.6L12 12.8Z" />
);

/** A data table: a solid header row and four cells. */
export const IconTable = (p: Props) => (
  <Glyph {...p} d="M1.5 2.5h21v19h-21Z M4 9h7v4.5H4Z M13 9h7v4.5h-7Z M4 15.5h7V19H4Z M13 15.5h7V19h-7Z" />
);

/** A map marker with a round hole. */
export const IconPlace = (p: Props) => (
  <Glyph {...p} d="M12 1.5a7.5 7.5 0 0 1 7.5 7.5C19.5 14.5 12 22.5 12 22.5S4.5 14.5 4.5 9A7.5 7.5 0 0 1 12 1.5Z M12 6.25a2.75 2.75 0 1 0 0 5.5a2.75 2.75 0 1 0 0-5.5Z" />
);

/** A square speech panel, for the rights assistant. */
export const IconSpeech = (p: Props) => (
  <Glyph {...p} d="M1.5 2.5h21v15H10l-5.5 4.5v-4.5h-3Z M6 8.5h3v3H6Z M10.5 8.5h3v3h-3Z M15 8.5h3v3h-3Z" />
);

/** A solid magnifier: the search button. */
export const IconSearch = (p: Props) => (
  <Glyph
    {...p}
    d="M10 1.5a8.5 8.5 0 1 1 0 17a8.5 8.5 0 1 1 0-17Z M10 5a5 5 0 1 0 0 10a5 5 0 1 0 0-10Z"
    solid="M15.9 13.6L22.6 20.3L20.3 22.6L13.6 15.9Z"
  />
);

/** A block arrow, as on a direction sign. */
export const IconArrow = (p: Props) => <Glyph {...p} d="M1.5 9.5h11V4l10 8l-10 8v-5.5h-11Z" />;

/** A block arrow pointing up and out: a link to another website. */
export const IconOut = (p: Props) => (
  <Glyph {...p} d="M8 3.5H20.5V16L16.1 11.6L7.4 20.3L3.7 16.6L12.4 7.9Z" />
);

/** Down onto a bar: download. */
export const IconDownload = (p: Props) => <Glyph {...p} d="M9.75 1.5h4.5v7.5h4.5L12 16.5L5.25 9h4.5Z M2.5 18.5h19v3.5h-19Z" />;

/** A heavy tick. */
export const IconCheck = (p: Props) => <Glyph {...p} d="M1.5 12.5L4.6 9.4L9.4 14.2L19.4 4.2L22.5 7.3L9.4 20.4Z" />;

/** Solid triangles in place of chevrons. */
export const IconDown = (p: Props) => <Glyph {...p} d="M4 7.5h16l-8 10Z" />;
export const IconUp = (p: Props) => <Glyph {...p} d="M4 16.5h16l-8-10Z" />;
export const IconRight = (p: Props) => <Glyph {...p} d="M7.5 4v16l10-8Z" />;

/** A square padlock: the address bar of a secure page. */
export const IconLock = (p: Props) => (
  <Glyph {...p} d="M6.5 10V7.5a5.5 5.5 0 0 1 11 0V10h-3V7.5a2.5 2.5 0 0 0-5 0V10Z M3.5 10h17v12.5h-17Z M10.75 13.5h2.5v5h-2.5Z" />
);
