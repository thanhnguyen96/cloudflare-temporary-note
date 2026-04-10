interface DailyCounter {
  date: string;
  read: number;
  write: number;
}

interface CheckPayload {
  kind?: unknown;
  limit?: unknown;
}

export class RateLimiterDO {
  private readonly state: DurableObjectState;

  constructor(state: DurableObjectState, _env: unknown) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return json({ error: "Method not allowed." }, 405);
    }

    const payload = (await request.json().catch(() => null)) as CheckPayload | null;
    const kind = payload?.kind === "write" ? "write" : payload?.kind === "read" ? "read" : "";
    const limit = Number(payload?.limit ?? 0);

    if (!kind || !Number.isFinite(limit) || limit <= 0) {
      return json({ error: "Invalid rate-limit payload." }, 400);
    }

    const today = new Date().toISOString().slice(0, 10);
    const current = (await this.state.storage.get<DailyCounter>("counter")) ?? {
      date: today,
      read: 0,
      write: 0,
    };

    const counter: DailyCounter =
      current.date === today ? current : { date: today, read: 0, write: 0 };

    const nextCount = counter[kind] + 1;
    if (nextCount > limit) {
      return json(
        {
          allowed: false,
          count: counter[kind],
          limit,
          remaining: 0,
        },
        200,
      );
    }

    counter[kind] = nextCount;
    await this.state.storage.put("counter", counter);

    return json({
      allowed: true,
      count: nextCount,
      limit,
      remaining: Math.max(0, limit - nextCount),
    });
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
