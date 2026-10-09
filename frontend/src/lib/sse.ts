import type { AssistantEvent } from "@/lib/types";

/**
 * Reads the assistant's answer stream: Server-Sent Events, where each event is a line
 * `data: {...json...}` followed by a blank line. Network chunks can end mid-event, so whatever
 * comes after the last blank line is kept and joined to the next chunk.
 */
export async function* readEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<AssistantEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (value) buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = done ? "" : (parts.pop() ?? "");
    for (const part of parts) {
      const data = part
        .split("\n")
        .filter((line) => line.startsWith("data: "))
        .map((line) => line.slice(6))
        .join("\n");
      if (data) yield JSON.parse(data) as AssistantEvent;
    }
    if (done) return;
  }
}
