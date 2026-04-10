import type { Env } from "../types";

export async function runCleanup(env: Env): Promise<number> {
  const now = Date.now();
  const result = await env.DB.prepare("DELETE FROM notes WHERE expires_at <= ?1").bind(now).run();
  return Number(result.meta.changes ?? 0);
}

