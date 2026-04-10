export interface Env {
  DB: D1Database;
  FILES: R2Bucket;
  RATE_LIMITER: DurableObjectNamespace;
  ALLOWED_ORIGIN?: string;
  MAX_TEXT_LENGTH?: string;
  MAX_FILE_BYTES?: string;
  R2_ACCOUNT_ID?: string;
  R2_BUCKET_NAME?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
}

export interface NoteDto {
  id: string;
  roomId: string;
  kind: "text" | "file";
  body: string | null;
  file: {
    name: string;
    size: number;
    contentType: string;
    downloadUrl: string;
  } | null;
  createdAt: number;
  expiresAt: number;
}
