import type { Env } from "../types";

export function json(data: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");

  return new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers,
  });
}

export function error(message: string, status = 400): Response {
  return json({ error: message }, { status });
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function withCors(response: Response, request: Request, env: Env): Response {
  const headers = new Headers(response.headers);
  const requestOrigin = request.headers.get("origin") ?? "";
  const rawAllowed = env.ALLOWED_ORIGIN?.trim() || "*";
  const allowedList = rawAllowed
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const allowAll = allowedList.includes("*");
  let origin = "*";

  if (!allowAll) {
    origin = "";

    if (requestOrigin && allowedList.includes(requestOrigin)) {
      origin = requestOrigin;
    }
  }

  if (origin) {
    headers.set("access-control-allow-origin", origin);
  }

  headers.set("access-control-allow-methods", "GET,POST,OPTIONS");
  headers.set("access-control-allow-headers", "content-type");
  headers.set("access-control-max-age", "86400");
  headers.set("vary", "origin");

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

export function options(request: Request, env: Env): Response {
  return withCors(new Response(null, { status: 204 }), request, env);
}
