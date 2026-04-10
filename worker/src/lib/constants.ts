export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function getMaxTextLength(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 5000;
}

export function getMaxFileBytes(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1024 * 1024 * 1024;
}

export const MIN_MULTIPART_PART_BYTES = 5 * 1024 * 1024;
export const DEFAULT_PART_SIZE_BYTES = 16 * 1024 * 1024;
export const MAX_MULTIPART_PARTS = 10000;
export const PRESIGNED_URL_TTL_SECONDS = 900;
