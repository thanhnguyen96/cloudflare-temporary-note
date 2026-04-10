const ROOM_REGEX = /^[a-z0-9][a-z0-9_-]{1,63}$/;

export function isValidRoomId(roomId: string): boolean {
  return ROOM_REGEX.test(roomId);
}

