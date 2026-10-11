/**
 * The browser asks the assistant through this route, on the website's own address. It adds the
 * proxy secret and the visitor's address (for the API's per-visitor limit), then passes the
 * API's stream of events straight through as it arrives.
 */

const API_URL = process.env.API_URL ?? "http://localhost:8000";
const MAX_BODY = 4_000;

export const dynamic = "force-dynamic";
// A live answer takes several rounds of searching and reading; give it time to finish.
export const maxDuration = 120;

export async function POST(request: Request) {
  const body = await request.text();
  if (body.length > MAX_BODY) return Response.json({ detail: "That question is too long." }, { status: 413 });

  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "text/event-stream",
  };
  if (process.env.API_PROXY_SECRET) headers["x-civiclens-proxy"] = process.env.API_PROXY_SECRET;
  // On Vercel the first X-Forwarded-For entry is the visitor's real address.
  const visitor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (visitor) headers["x-forwarded-for"] = visitor;

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/api/assistant/ask`, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
      signal: request.signal,
    });
  } catch {
    return Response.json(
      {
        detail: "We couldn't reach the CivicLens server. Please try again in a minute.",
      },
      { status: 503 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    let detail = "Something went wrong on our side.";
    try {
      const data = await upstream.json();
      if (typeof data.detail === "string") detail = data.detail;
      else if (upstream.status === 422) detail = "Please write a question of at least a few words.";
    } catch {}
    return Response.json({ detail }, { status: upstream.status });
  }

  return new Response(upstream.body, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
    },
  });
}
