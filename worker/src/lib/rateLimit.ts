import { error } from "./http";
import type { Env } from "../types";

type LimitKind = "read" | "write";

const LIMITS: Record<LimitKind, number> = {
  read: 1000,
  write: 100,
};

interface DOCheckResult {
  allowed?: boolean;
  count?: number;
  limit?: number;
  remaining?: number;
}

export interface RateLimitCheckOk {
  ok: true;
  headers: Record<string, string>;
}

export interface RateLimitCheckBlocked {
  ok: false;
  response: Response;
}

export type RateLimitCheckResult = RateLimitCheckOk | RateLimitCheckBlocked;

export async function enforceRateLimit(
  request: Request,
  env: Env,
  kind: LimitKind,
): Promise<RateLimitCheckResult> {
  const ip = extractClientIp(request);
  const durableId = env.RATE_LIMITER.idFromName(ip);
  const stub = env.RATE_LIMITER.get(durableId);
  const limit = LIMITS[kind];

  const response = await stub.fetch("https://rate-limit/check", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      kind,
      limit,
    }),
  });

  if (!response.ok) {
    return {
      ok: false,
      response: error("Rate limiter unavailable.", 503),
    };
  }

  const payload = (await response.json().catch(() => null)) as DOCheckResult | null;
  const effectiveLimit = Number(payload?.limit ?? limit);
  const used = Number(payload?.count ?? 0);
  const remaining = Number(payload?.remaining ?? Math.max(0, effectiveLimit - used));
  const headers = {
    "x-rate-limit-kind": kind,
    "x-rate-limit-limit": String(effectiveLimit),
    "x-rate-limit-used": String(used),
    "x-rate-limit-remaining": String(Math.max(0, remaining)),
  };

  if (payload?.allowed) {
    return {
      ok: true,
      headers,
    };
  }

  const blocked = error(
    kind === "write"
      ? "Rate limit exceeded: max 100 write requests per IP per day."
      : "Rate limit exceeded: max 1000 read requests per IP per day.",
    429,
  );

  return {
    ok: false,
    response: withHeaders(blocked, headers),
  };
}

function extractClientIp(request: Request): string {
  const headerIp = request.headers.get("cf-connecting-ip")?.trim() ?? "";
  if (headerIp) {
    return headerIp;
  }
  return "unknown-ip";
}

function withHeaders(response: Response, headers: Record<string, string>): Response {
  const next = new Response(response.body, response);
  for (const [key, value] of Object.entries(headers)) {
    next.headers.set(key, value);
  }
  return next;
}
