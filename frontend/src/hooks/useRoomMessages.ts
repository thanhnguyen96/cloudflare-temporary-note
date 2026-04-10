import { useCallback, useEffect, useState } from "react";
import { fetchRoomMessages, sendTextMessage, uploadRoomFile } from "../lib/api";
import type { ChatMessage } from "../lib/types";

interface UseRoomMessagesResult {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sending: boolean;
  uploading: boolean;
  uploadLoaded: number;
  uploadTotal: number;
  refresh: () => Promise<void>;
  submitText: (content: string) => Promise<void>;
  submitFile: (file: File) => Promise<void>;
}

export function useRoomMessages(roomId: string, enabled = true): UseRoomMessagesResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadLoaded, setUploadLoaded] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await fetchRoomMessages(roomId);
      setMessages(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setMessages([]);
      return;
    }

    void refresh();
  }, [enabled, refresh]);

  async function submitText(content: string): Promise<void> {
    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }

    setSending(true);
    try {
      await sendTextMessage(roomId, trimmed);
      await refresh();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSending(false);
    }
  }

  async function submitFile(file: File): Promise<void> {
    setUploading(true);
    setUploadLoaded(0);
    setUploadTotal(file.size);
    try {
      await uploadRoomFile(roomId, file, {
        onProgress: (loaded, total) => {
          setUploadLoaded(loaded);
          setUploadTotal(total);
        },
      });
      await refresh();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setUploading(false);
      setUploadLoaded(0);
      setUploadTotal(0);
    }
  }

  return {
    messages,
    loading,
    error,
    sending,
    uploading,
    uploadLoaded,
    uploadTotal,
    refresh,
    submitText,
    submitFile,
  };
}
