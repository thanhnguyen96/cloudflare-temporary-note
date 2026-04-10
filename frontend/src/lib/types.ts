export type Language = "vi" | "en";
export type Theme = "light" | "dark";

export type MessageKind = "text" | "file";

export interface FileAttachment {
  name: string;
  size: number;
  contentType: string;
  downloadUrl: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  kind: MessageKind;
  body: string | null;
  file: FileAttachment | null;
  createdAt: number;
  expiresAt: number;
}

export interface Dictionary {
  appName: string;
  roomInputPlaceholder: string;
  joinRoom: string;
  joinHint: string;
  roomLabel: string;
  roomNote: string;
  messagePlaceholder: string;
  send: string;
  upload: string;
  uploading: string;
  emptyRoom: string;
  backHome: string;
  invalidRoom: string;
  loading: string;
  language: string;
  theme: string;
  light: string;
  dark: string;
  enterRoom: string;
  textTooLong: string;
  fileTooLarge: string;
  refresh: string;
}
