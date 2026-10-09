/** A plain search form: it works before (and without) any JavaScript. */
export function LawSearchForm({
  defaultValue = "",
  act,
  autoFocus = false,
  label = "Search the laws",
}: {
  defaultValue?: string;
  act?: string;
  autoFocus?: boolean;
  label?: string;
}) {
  return (
    <form action="/laws/search" method="get" role="search">
      <label htmlFor="law-q" className="mb-2 block text-sm font-semibold">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id="law-q"
          name="q"
          type="search"
          className="input"
          placeholder={act ? "e.g. appeal" : "e.g. police won't register my FIR"}
          defaultValue={defaultValue}
          maxLength={200}
          required
          autoFocus={autoFocus}
        />
        {act && <input type="hidden" name="act" value={act} />}
        <button type="submit" className="btn btn-primary min-h-12 px-5">
          Search
        </button>
      </div>
    </form>
  );
}
