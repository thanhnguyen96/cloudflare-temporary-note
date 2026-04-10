import { ONE_DAY_MS } from "../lib/constants";
import { sanitizeContentType, sanitizeFilename } from "../lib/format";
import { createId } from "../lib/id";
import type { Env, NoteDto } from "../types";

interface NoteRow {
  id: string;
  room_id: string;
  type: string;
  body: string | null;
  file_key: string | null;
  file_size: number | null;
  created_at: number;
  expires_at: number;
}

export async function listMessages(env: Env, roomId: string): Promise<NoteDto[]> {
  const now = Date.now();
  const stmt = env.DB.prepare(
    `SELECT id, room_id, type, body, file_key, file_size, created_at, expires_at
     FROM notes
     WHERE room_id = ?1 AND expires_at > ?2
     ORDER BY created_at ASC
     LIMIT 300`,
  );

  const { results } = await stmt.bind(roomId, now).all<NoteRow>();
  return results.map((row) => toDto(row));
}

export async function createTextMessage(
  env: Env,
  roomId: string,
  content: string,
): Promise<NoteDto> {
  const id = createId();
  const now = Date.now();
  const expiresAt = now + ONE_DAY_MS;

  await env.DB.prepare(
    `INSERT INTO notes (id, room_id, type, body, file_key, file_size, created_at, expires_at)
     VALUES (?1, ?2, 'text/plain', ?3, NULL, NULL, ?4, ?5)`,
  )
    .bind(id, roomId, content, now, expiresAt)
    .run();

  return {
    id,
    roomId,
    kind: "text",
    body: content,
    file: null,
    createdAt: now,
    expiresAt,
  };
}

export async function createFileMessageFromObject(
  env: Env,
  roomId: string,
  file: { key: string; name: string; size: number; contentType: string },
): Promise<NoteDto> {
  const id = createId();
  const now = Date.now();
  const expiresAt = now + ONE_DAY_MS;
  const fileName = sanitizeFilename(file.name || "upload.bin");
  const contentType = sanitizeContentType(file.contentType || "application/octet-stream");

  await env.DB.prepare(
    `INSERT INTO notes (id, room_id, type, body, file_key, file_size, created_at, expires_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
  )
    .bind(id, roomId, contentType, fileName, file.key, file.size, now, expiresAt)
    .run();

  return {
    id,
    roomId,
    kind: "file",
    body: null,
    file: {
      name: fileName,
      size: file.size,
      contentType,
      downloadUrl: `/api/files/${id}?roomId=${encodeURIComponent(roomId)}`,
    },
    createdAt: now,
    expiresAt,
  };
}

export async function getFileForDownload(
  env: Env,
  id: string,
  roomId: string,
): Promise<{
  key: string;
  filename: string;
  contentType: string;
} | null> {
  const now = Date.now();
  const row = await env.DB.prepare(
    `SELECT file_key, body, type
     FROM notes
     WHERE id = ?1
       AND room_id = ?2
       AND file_key IS NOT NULL
       AND expires_at > ?3
     LIMIT 1`,
  )
    .bind(id, roomId, now)
    .first<{ file_key: string; body: string; type: string }>();

  if (!row) {
    return null;
  }

  return {
    key: row.file_key,
    filename: row.body || "download.bin",
    contentType: row.type || "application/octet-stream",
  };
}

function toDto(row: NoteRow): NoteDto {
  const isFile = Boolean(row.file_key);

  return {
    id: row.id,
    roomId: row.room_id,
    kind: isFile ? "file" : "text",
    body: isFile ? null : row.body,
    file:
      isFile
        ? {
            name: row.body || "file.bin",
            size: row.file_size ?? 0,
            contentType: row.type || "application/octet-stream",
            downloadUrl: `/api/files/${row.id}?roomId=${encodeURIComponent(row.room_id)}`,
          }
        : null,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}
