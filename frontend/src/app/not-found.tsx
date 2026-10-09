import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <p className="eyebrow">Not found</p>
      <h1 className="mt-2 text-2xl font-bold">We couldn&apos;t find that page</h1>
      <p className="mt-3 text-muted">The link may be wrong, or the page may have moved.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          Find your representatives
        </Link>
        <Link href="/laws" className="btn btn-secondary">
          Browse laws
        </Link>
      </div>
    </div>
  );
}
