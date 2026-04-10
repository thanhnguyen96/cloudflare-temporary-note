import { buildContentDisposition } from "../lib/format";
import { error } from "../lib/http";
import { isValidRoomId } from "../lib/room";
import { getFileForDownload } from "../services/messages";
import type { Env } from "../types";

export async function handleFileDownload(
  env: Env,
  id: string,
  roomId: string,
): Promise<Response> {
  if (!isValidRoomId(roomId)) {
    return error("Invalid room ID.", 400);
  }

  const fileMeta = await getFileForDownload(env, id, roomId);
  if (!fileMeta) {
    return error("File not found or expired.", 404);
  }

  const object = await env.FILES.get(fileMeta.key);
  if (!object?.body) {
    return error("File object missing from bucket.", 404);
  }

  const headers = new Headers();
  headers.set("cache-control", "private, no-store");
  headers.set("content-type", fileMeta.contentType || "application/octet-stream");
  headers.set("content-disposition", buildContentDisposition(fileMeta.filename));

  return new Response(object.body, { status: 200, headers });
}
