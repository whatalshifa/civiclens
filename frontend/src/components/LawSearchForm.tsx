/** A plain search form: it works before (and without) any JavaScript. */
export function LawSearchForm({
  defaultValue = "",
  act,
  autoFocus = false,
  label = "Search the laws",
  quiet = false,
}: {
  defaultValue?: string;
  act?: string;
  autoFocus?: boolean;
  label?: string;
  /** A secondary button, for pages where another form is the main action. */
  quiet?: boolean;
}) {
  return (
    <form action="/laws/search" method="get" role="search">
      <label htmlFor="law-q" className="field-label">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id="law-q"
          name="q"
          type="search"
          className="input min-w-0 flex-1"
          placeholder={act ? "e.g. appeal" : "e.g. police won't register my FIR"}
          defaultValue={defaultValue}
          maxLength={200}
          required
          autoFocus={autoFocus}
        />
        {act && <input type="hidden" name="act" value={act} />}
        <button type="submit" className={`btn h-11 ${quiet ? "btn-secondary" : "btn-primary"}`}>
          Search
        </button>
      </div>
    </form>
  );
}
