import {
  MAX_MULTIPART_PARTS,
  ONE_DAY_MS,
  getMaxFileBytes,
} from "../lib/constants";
import { sanitizeContentType, sanitizeFilename } from "../lib/format";
import { error, json, readJson } from "../lib/http";
import {
  choosePartSize,
  createPresignedUploadPartUrl,
  getS3ConfigError,
  normalizeCompletedParts,
} from "../lib/r2";
import { isValidRoomId } from "../lib/room";
import { createId } from "../lib/id";
import { createFileMessageFromObject } from "../services/messages";
import type { Env } from "../types";

interface StartUploadRequest {
  roomId?: unknown;
  filename?: unknown;
  size?: unknown;
  contentType?: unknown;
}

interface CompleteUploadRequest {
  roomId?: unknown;
  key?: unknown;
  uploadId?: unknown;
  parts?: unknown;
  filename?: unknown;
  size?: unknown;
  contentType?: unknown;
}

interface AbortUploadRequest {
  key?: unknown;
  uploadId?: unknown;
}

export async function handleStartUpload(request: Request, env: Env): Promise<Response> {
  const configError = getS3ConfigError(env);
  if (configError) {
    return error(configError, 500);
  }

  const body = await readJson<StartUploadRequest>(request);
  const roomId = typeof body?.roomId === "string" ? body.roomId.trim() : "";
  const filename = sanitizeFilename(typeof body?.filename === "string" ? body.filename : "");
  const size = Number(body?.size ?? 0);
  const contentType = sanitizeContentType(typeof body?.contentType === "string" ? body.contentType : "");
  const maxFileBytes = getMaxFileBytes(env.MAX_FILE_BYTES);

  if (!isValidRoomId(roomId)) {
    return error("Invalid room ID.", 400);
  }
  if (!filename) {
    return error("Filename is required.", 400);
  }
  if (!Number.isFinite(size) || size <= 0) {
    return error("Invalid file size.", 400);
  }
  if (size > maxFileBytes) {
    return error(`File exceeds ${maxFileBytes} bytes.`, 413);
  }

  const partSize = choosePartSize(size);
  const partCount = Math.ceil(size / partSize);
  if (partCount > MAX_MULTIPART_PARTS) {
    return error("Too many parts for multipart upload.", 400);
  }

  const key = createId();
  const now = Date.now();
  const expiresAt = now + ONE_DAY_MS;

  const multipart = await env.FILES.createMultipartUpload(key, {
    httpMetadata: {
      contentType,
    },
    customMetadata: {
      roomId,
      uploadedAt: String(now),
      expiresAt: String(expiresAt),
      uploadMode: "worker-multipart-presigned",
    },
  });

  return json({
    key,
    uploadId: multipart.uploadId,
    partSize,
    partCount,
    expiresAt,
    maxFileBytes,
  });
}

export async function handleUploadPartUrl(url: URL, env: Env): Promise<Response> {
  const configError = getS3ConfigError(env);
  if (configError) {
    return error(configError, 500);
  }

  const key = (url.searchParams.get("key") ?? "").trim();
  const uploadId = (url.searchParams.get("uploadId") ?? "").trim();
  const partNumber = Number(url.searchParams.get("partNumber") ?? 0);

  if (!key || !uploadId || !Number.isInteger(partNumber)) {
    return error("Missing required query params.", 400);
  }
  if (partNumber < 1 || partNumber > MAX_MULTIPART_PARTS) {
    return error(`partNumber must be between 1 and ${MAX_MULTIPART_PARTS}.`, 400);
  }

  const signedUrl = await createPresignedUploadPartUrl(env, key, uploadId, partNumber);
  return json({ signedUrl });
}

export async function handleCompleteUpload(request: Request, env: Env): Promise<Response> {
  const body = await readJson<CompleteUploadRequest>(request);
  const roomId = typeof body?.roomId === "string" ? body.roomId.trim() : "";
  const key = typeof body?.key === "string" ? body.key.trim() : "";
  const uploadId = typeof body?.uploadId === "string" ? body.uploadId.trim() : "";
  const filename = sanitizeFilename(typeof body?.filename === "string" ? body.filename : "");
  const size = Number(body?.size ?? 0);
  const contentType = sanitizeContentType(typeof body?.contentType === "string" ? body.contentType : "");

  if (!isValidRoomId(roomId)) {
    return error("Invalid room ID.", 400);
  }
  if (!key || !uploadId || !filename || !Number.isFinite(size) || size <= 0) {
    return error("Missing required upload payload.", 400);
  }

  const normalized = normalizeCompletedParts(body?.parts);
  if (!normalized.ok) {
    return error(normalized.error, 400);
  }

  const multipart = env.FILES.resumeMultipartUpload(key, uploadId);
  await multipart.complete(normalized.parts);

  const message = await createFileMessageFromObject(env, roomId, {
    key,
    name: filename,
    size,
    contentType,
  });

  return json({ message }, { status: 201 });
}

export async function handleAbortUpload(request: Request, env: Env): Promise<Response> {
  const body = await readJson<AbortUploadRequest>(request);
  const key = typeof body?.key === "string" ? body.key.trim() : "";
  const uploadId = typeof body?.uploadId === "string" ? body.uploadId.trim() : "";

  if (!key || !uploadId) {
    return error("Missing key or uploadId.", 400);
  }

  await env.FILES.resumeMultipartUpload(key, uploadId).abort();
  return json({ ok: true });
}
