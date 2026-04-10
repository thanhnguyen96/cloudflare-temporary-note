import type { ChatMessage } from "./types";

const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

interface MessageDto {
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

interface ListResponse {
  messages: MessageDto[];
}

interface CreateResponse {
  message: MessageDto;
}

interface StartUploadResponse {
  key: string;
  uploadId: string;
  partSize: number;
  partCount: number;
}

interface PartUrlResponse {
  signedUrl: string;
}

interface UploadFileOptions {
  onProgress?: (loaded: number, total: number) => void;
}

export async function fetchRoomMessages(roomId: string): Promise<ChatMessage[]> {
  const payload = await request<ListResponse>(`/api/rooms/${encodeURIComponent(roomId)}/messages`);
  return payload.messages.map(mapMessage);
}

export async function sendTextMessage(roomId: string, content: string): Promise<ChatMessage> {
  const payload = await request<CreateResponse>(`/api/rooms/${encodeURIComponent(roomId)}/messages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content }),
  });

  return mapMessage(payload.message);
}

export async function uploadRoomFile(
  roomId: string,
  file: File,
  options?: UploadFileOptions,
): Promise<ChatMessage> {
  const onProgress = options?.onProgress;
  const start = await request<StartUploadResponse>("/api/uploads/start", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      roomId,
      filename: file.name,
      size: file.size,
      contentType: file.type || "application/octet-stream",
    }),
  });

  const uploadedParts: Array<{ partNumber: number; etag: string }> = [];
  let completedBytes = 0;
  onProgress?.(0, file.size);

  try {
    for (let partNumber = 1; partNumber <= start.partCount; partNumber += 1) {
      const begin = (partNumber - 1) * start.partSize;
      const end = Math.min(begin + start.partSize, file.size);
      const partBlob = file.slice(begin, end);

      const query = new URLSearchParams({
        key: start.key,
        uploadId: start.uploadId,
        partNumber: String(partNumber),
      });
      const { signedUrl } = await request<PartUrlResponse>(`/api/uploads/part-url?${query.toString()}`);

      const etag = await uploadPartWithProgress(signedUrl, partBlob, (loaded) => {
        onProgress?.(completedBytes + loaded, file.size);
      });

      completedBytes += partBlob.size;
      onProgress?.(completedBytes, file.size);

      uploadedParts.push({ partNumber, etag });
    }

    const payload = await request<CreateResponse>("/api/uploads/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        roomId,
        key: start.key,
        uploadId: start.uploadId,
        parts: uploadedParts,
        filename: file.name,
        size: file.size,
        contentType: file.type || "application/octet-stream",
      }),
    });

    onProgress?.(file.size, file.size);
    return mapMessage(payload.message);
  } catch (error) {
    try {
      await request<{ ok: boolean }>("/api/uploads/abort", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          key: start.key,
          uploadId: start.uploadId,
        }),
      });
    } catch {
      // ignored
    }

    throw error;
  }
}

function uploadPartWithProgress(
  signedUrl: string,
  chunk: Blob,
  onProgress: (loaded: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);

    xhr.upload.onprogress = (event) => {
      onProgress(event.loaded || 0);
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`Part upload failed (${xhr.status}).`));
        return;
      }

      const etag = xhr.getResponseHeader("etag");
      if (!etag) {
        reject(new Error("Missing ETag from upload response."));
        return;
      }

      resolve(etag.replace(/^"+|"+$/g, ""));
    };

    xhr.onerror = () => {
      reject(new Error("Network error while uploading file part."));
    };

    xhr.onabort = () => {
      reject(new Error("Upload aborted."));
    };

    xhr.send(chunk);
  });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "omit",
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw new Error(message || `Request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

async function extractErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; message?: string }
      | null;
    if (payload?.error) {
      return payload.error;
    }
    if (payload?.message) {
      return payload.message;
    }
  }

  const text = await response.text().catch(() => "");
  return text.trim();
}

function mapMessage(raw: MessageDto): ChatMessage {
  const resolvedFile =
    raw.file && raw.file.downloadUrl.startsWith("/") && API_BASE
      ? { ...raw.file, downloadUrl: `${API_BASE}${raw.file.downloadUrl}` }
      : raw.file;

  return {
    id: raw.id,
    roomId: raw.roomId,
    kind: raw.kind,
    body: raw.body,
    file: resolvedFile,
    createdAt: raw.createdAt,
    expiresAt: raw.expiresAt,
  };
}
