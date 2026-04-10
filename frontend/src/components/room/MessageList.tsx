import type { ChatMessage, Dictionary } from "../../lib/types";
import { MessageItem } from "./MessageItem";

interface MessageListProps {
  dictionary: Dictionary;
  messages: ChatMessage[];
}

export function MessageList({ dictionary, messages }: MessageListProps): JSX.Element {
  if (messages.length === 0) {
    return <p className="message-list__empty">{dictionary.emptyRoom}</p>;
  }

  return (
    <section className="message-list">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
    </section>
  );
}

