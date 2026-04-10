import { json } from "../lib/http";

export function handleHealth(): Response {
  return json({
    ok: true,
    service: "note-24h-worker",
    timestamp: new Date().toISOString(),
  });
}

