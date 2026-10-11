"use client";

/**
 * The last resort, when the root layout itself fails: it replaces the whole document, so the
 * stylesheet and fonts aren't there. The brand's colours are written in directly.
 */
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f3f5f4", color: "#081513" }}>
        <title>Something went wrong · CivicLens</title>
        <header style={{ background: "#0b3a36", color: "#fff", padding: "18px 24px" }}>
          <strong style={{ letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 22 }}>
            Civic<span style={{ color: "#ffc829" }}>Lens</span>
          </strong>
        </header>
        <main style={{ maxWidth: 480, margin: "64px auto", padding: "0 16px", textAlign: "center" }}>
          <h1 style={{ fontSize: 30, lineHeight: 1.1 }}>We couldn&apos;t load CivicLens</h1>
          <p style={{ color: "#44514e", lineHeight: 1.6 }}>
            The server may be waking up after a quiet spell, which takes about a minute. Please try again.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: 16,
              padding: "12px 20px",
              border: "2px solid #081513",
              background: "#0c6359",
              color: "#fff",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
