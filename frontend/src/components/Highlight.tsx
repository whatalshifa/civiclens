/** Shows text from the search API, where matching words come wrapped in « and ». */
export function Highlight({ text }: { text: string }) {
  const parts = text.split(/«|»/);
  // Splitting "a «b» c" gives ["a ", "b", " c"]: every odd part was inside the marks.
  return <>{parts.map((part, i) => (i % 2 === 1 ? <mark key={i}>{part}</mark> : part))}</>;
}
