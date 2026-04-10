import { useEffect, useRef } from "react";
import type { ChatMessage, Dictionary } from "../../lib/types";
import { MessageItem } from "./MessageItem";

interface MessageListProps {
  dictionary: Dictionary;
  messages: ChatMessage[];
}

export function MessageList({ dictionary, messages }: MessageListProps): JSX.Element {
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomAnchorRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <section className="message-list">
      {messages.length === 0 ? <p className="message-list__empty">{dictionary.emptyRoom}</p> : null}
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      <div ref={bottomAnchorRef} className="message-list__anchor" />
    </section>
  );
}
