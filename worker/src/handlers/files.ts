import { getMaxFileBytes } from "../lib/constants";
import { buildContentDisposition } from "../lib/format";
import { error, json } from "../lib/http";
import { isValidRoomId } from "../lib/room";
import { createFileMessage, getFileForDownload } from "../services/messages";
import type { UploadFileLike } from "../services/messages";
import type { Env } from "../types";

export async function handleUploadFile(
  request: Request,
  env: Env,
  roomId: string,
): Promise<Response> {
  if (!isValidRoomId(roomId)) {
    return error("Invalid room ID.", 400);
  }

  const formData = await request.formData();
  const uploaded = formData.get("file");

  if (!isFileLike(uploaded)) {
    return error("File is required.", 400);
  }

  const file = uploaded;

  const maxFileBytes = getMaxFileBytes(env.MAX_FILE_BYTES);
  if (file.size <= 0) {
    return error("Empty file is not allowed.", 400);
  }

  if (file.size > maxFileBytes) {
    return error(`File exceeds ${maxFileBytes} bytes.`, 413);
  }

  const message = await createFileMessage(env, roomId, file);
  return json({ message }, { status: 201 });
}

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

function isFileLike(value: unknown): value is UploadFileLike {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<UploadFileLike>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.type === "string" &&
    typeof candidate.size === "number" &&
    typeof candidate.stream === "function"
  );
}
