import { getMaxTextLength } from "../lib/constants";
import { error, json, readJson } from "../lib/http";
import { isValidRoomId } from "../lib/room";
import { createTextMessage, listMessages } from "../services/messages";
import type { Env } from "../types";

interface CreateMessageRequest {
  content?: unknown;
}

export async function handleListMessages(env: Env, roomId: string): Promise<Response> {
  if (!isValidRoomId(roomId)) {
    return error("Invalid room ID.", 400);
  }

  const messages = await listMessages(env, roomId);
  return json({ messages });
}

export async function handleCreateMessage(
  request: Request,
  env: Env,
  roomId: string,
): Promise<Response> {
  if (!isValidRoomId(roomId)) {
    return error("Invalid room ID.", 400);
  }

  const body = await readJson<CreateMessageRequest>(request);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const maxLength = getMaxTextLength(env.MAX_TEXT_LENGTH);

  if (!content) {
    return error("Content is required.", 400);
  }

  if (content.length > maxLength) {
    return error(`Content exceeds ${maxLength} characters.`, 413);
  }

  const message = await createTextMessage(env, roomId, content);
  return json({ message }, { status: 201 });
}

