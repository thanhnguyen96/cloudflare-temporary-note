import { formatBytes } from "../../lib/format";
import type { ChatMessage } from "../../lib/types";

interface MessageItemProps {
  message: ChatMessage;
}

export function MessageItem({ message }: MessageItemProps): JSX.Element {
  const date = new Date(message.createdAt);
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (message.kind === "file" && message.file) {
    return (
      <article className="message-item message-item--file">
        <div className="message-item__content">
          <a className="message-item__file-link" href={message.file.downloadUrl} target="_blank" rel="noreferrer">
            {message.file.name}
          </a>
          <span className="message-item__meta">
            {formatBytes(message.file.size)} | {time}
          </span>
        </div>
      </article>
    );
  }

  return (
    <article className="message-item message-item--text">
      <div className="message-item__content">
        <p className="message-item__text">{message.body ?? ""}</p>
        <span className="message-item__meta">{time}</span>
      </div>
    </article>
  );
}
