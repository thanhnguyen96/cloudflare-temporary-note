import { handleFileDownload } from "./handlers/files";
import { handleHealth } from "./handlers/health";
import { handleCreateMessage, handleListMessages } from "./handlers/messages";
import {
  handleAbortUpload,
  handleCompleteUpload,
  handleStartUpload,
  handleUploadPartUrl,
} from "./handlers/uploads";
import { RateLimiterDO } from "./durable/RateLimiterDO";
import { options, withCors, error } from "./lib/http";
import { enforceRateLimit } from "./lib/rateLimit";
import { runCleanup } from "./jobs/cleanup";
import type { Env } from "./types";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return options(request, env);
    }

    const url = new URL(request.url);
    const pathname = trimTrailingSlash(url.pathname);

    try {
      const response = await routeRequest(request, env, pathname, url);
      return withCors(response, request, env);
    } catch (cause) {
      console.error("Unhandled error:", cause);
      return withCors(error("Internal server error.", 500), request, env);
    }
  },

  async scheduled(_: ScheduledController, env: Env): Promise<void> {
    const deleted = await runCleanup(env);
    console.log(`cleanup completed, deleted=${deleted}`);
  },
};

export { RateLimiterDO };

async function routeRequest(
  request: Request,
  env: Env,
  pathname: string,
  url: URL,
): Promise<Response> {
  if (request.method === "GET" && pathname === "/api/health") {
    return handleHealth();
  }

  const roomMessages = pathname.match(/^\/api\/rooms\/([^/]+)\/messages$/);
  if (roomMessages) {
    const roomId = decodeURIComponent(roomMessages[1]);
    if (request.method === "GET") {
      const rate = await enforceRateLimit(request, env, "read");
      if (!rate.ok) {
        return rate.response;
      }
      return withHeaders(await handleListMessages(env, roomId), rate.headers);
    }
    if (request.method === "POST") {
      const rate = await enforceRateLimit(request, env, "write");
      if (!rate.ok) {
        return rate.response;
      }
      return withHeaders(await handleCreateMessage(request, env, roomId), rate.headers);
    }
  }

  if (pathname === "/api/uploads/start" && request.method === "POST") {
    const rate = await enforceRateLimit(request, env, "write");
    if (!rate.ok) {
      return rate.response;
    }
    return withHeaders(await handleStartUpload(request, env), rate.headers);
  }
  if (pathname === "/api/uploads/part-url" && request.method === "GET") {
    return handleUploadPartUrl(url, env);
  }
  if (pathname === "/api/uploads/complete" && request.method === "POST") {
    return handleCompleteUpload(request, env);
  }
  if (pathname === "/api/uploads/abort" && request.method === "POST") {
    return handleAbortUpload(request, env);
  }

  const fileDownload = pathname.match(/^\/api\/files\/([^/]+)$/);
  if (fileDownload && request.method === "GET") {
    const rate = await enforceRateLimit(request, env, "read");
    if (!rate.ok) {
      return rate.response;
    }
    const roomId = url.searchParams.get("roomId") ?? "";
    return withHeaders(
      await handleFileDownload(env, decodeURIComponent(fileDownload[1]), roomId),
      rate.headers,
    );
  }

  return error("Not found.", 404);
}

function trimTrailingSlash(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function withHeaders(response: Response, headers: Record<string, string>): Response {
  const next = new Response(response.body, response);
  for (const [key, value] of Object.entries(headers)) {
    next.headers.set(key, value);
  }
  return next;
}
