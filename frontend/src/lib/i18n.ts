import type { Dictionary, Language } from "./types";

const VI: Dictionary = {
  appName: "Note 24h",
  roomInputPlaceholder: "Nhập tên room",
  joinRoom: "Vào room",
  joinHint: "Dữ liệu trong room tự hết hạn sau 24 giờ.",
  roomLabel: "Room",
  roomNote: "Tin nhắn và tệp chỉ tồn tại 24 giờ kể từ lúc gửi.",
  messagePlaceholder: "Nhập nội dung...",
  send: "Gửi",
  upload: "Đính kèm tệp",
  uploading: "Đang tải tệp...",
  emptyRoom: "Chưa có nội dung nào trong room này.",
  backHome: "Về trang chính",
  invalidRoom: "Room không hợp lệ.",
  loading: "Đang tải...",
  language: "Ngôn ngữ",
  theme: "Giao diện",
  light: "Sáng",
  dark: "Tối",
  enterRoom: "Tạo hoặc vào room",
  textTooLong: "Nội dung quá dài.",
  fileTooLarge: "Tệp vượt quá dung lượng cho phép.",
  refresh: "Làm mới",
};

const EN: Dictionary = {
  appName: "Note 24h",
  roomInputPlaceholder: "Enter room name",
  joinRoom: "Join room",
  joinHint: "Room content expires automatically after 24 hours.",
  roomLabel: "Room",
  roomNote: "Messages and files expire 24 hours after upload.",
  messagePlaceholder: "Write something...",
  send: "Send",
  upload: "Attach file",
  uploading: "Uploading file...",
  emptyRoom: "No messages in this room yet.",
  backHome: "Back home",
  invalidRoom: "Invalid room.",
  loading: "Loading...",
  language: "Language",
  theme: "Theme",
  light: "Light",
  dark: "Dark",
  enterRoom: "Create or join room",
  textTooLong: "Text is too long.",
  fileTooLarge: "File is too large.",
  refresh: "Refresh",
};

export function getDictionary(language: Language): Dictionary {
  return language === "vi" ? VI : EN;
}
