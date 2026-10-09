import "server-only";

import { readEvents } from "@/lib/sse";
import type { AssistantEvent } from "@/lib/types";

/**
 * Pages are rendered on the server, which fetches from the API (FastAPI) directly. The browser
 * never talks to the API, so there is no CORS to set up, and the proxy secret stays on the server.
 *
 * Answers are cached for an hour: the data changes when the pipeline runs, not per visit, and
 * caching means most visitors never wait for the free-tier API to wake up.
 */

const API_URL = process.env.API_URL ?? "http://localhost:8000";
const REVALIDATE_SECONDS = 3600;
// A sleeping free-tier server can take most of a minute to wake up.
const TIMEOUT_MS = 75_000;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, { cache = true }: { cache?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (process.env.API_PROXY_SECRET) headers["x-civiclens-proxy"] = process.env.API_PROXY_SECRET;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      ...(cache ? { next: { revalidate: REVALIDATE_SECONDS } } : { cache: "no-store" }),
    });
  } catch {
    throw new ApiError(503, "We couldn't reach the CivicLens server. Please try again in a minute.");
  }
  if (!response.ok) {
    let detail = "Something went wrong on our side.";
    try {
      const body = await response.json();
      if (typeof body.detail === "string") detail = body.detail;
    } catch {}
    throw new ApiError(response.status, detail);
  }
  return response.json() as Promise<T>;
}

/** Replays a sample question on the server, for pages that show a finished answer without JavaScript. */
export async function replaySample(sample: string): Promise<AssistantEvent[]> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (process.env.API_PROXY_SECRET) headers["x-civiclens-proxy"] = process.env.API_PROXY_SECRET;
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/assistant/ask`, {
      method: "POST",
      headers,
      body: JSON.stringify({ question: sample, sample, instant: true }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new ApiError(503, "We couldn't reach the CivicLens server. Please try again in a minute.");
  }
  if (!response.ok || !response.body) throw new ApiError(response.status, "That sample question doesn't exist.");
  const events: AssistantEvent[] = [];
  for await (const event of readEvents(response.body)) events.push(event);
  return events;
}
