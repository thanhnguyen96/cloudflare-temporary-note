const ROOM_REGEX = /^[a-z0-9][a-z0-9_-]{1,63}$/;

export function isValidRoomId(value: string): boolean {
  return ROOM_REGEX.test(value);
}

export function toRoomId(input: string): string {
  const trimmed = input.trim();

  if (!trimmed) {
    return randomRoomId();
  }

  const fromUrl = parseRoomIdFromUrl(trimmed);
  const normalized = slugify(fromUrl ?? trimmed);

  return normalized || randomRoomId();
}

function parseRoomIdFromUrl(input: string): string | null {
  try {
    const url = new URL(input);
    const segments = url.pathname.split("/").filter(Boolean);

    if (segments.length >= 2 && segments[0] === "r") {
      return segments[1];
    }

    if (segments.length >= 1) {
      return segments[segments.length - 1];
    }

    return url.hostname;
  } catch {
    return null;
  }
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function randomRoomId(): string {
  return `room-${crypto.randomUUID().slice(0, 8)}`;
}

