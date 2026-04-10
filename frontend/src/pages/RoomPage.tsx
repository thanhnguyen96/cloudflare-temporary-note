import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { MessageComposer } from "../components/room/MessageComposer";
import { MessageList } from "../components/room/MessageList";
import { useRoomMessages } from "../hooks/useRoomMessages";
import { isValidRoomId } from "../lib/room";
import type { Dictionary } from "../lib/types";

interface RoomPageProps {
  dictionary: Dictionary;
}

export function RoomPage({ dictionary }: RoomPageProps): JSX.Element {
  const params = useParams();
  const roomId = useMemo(() => params.roomId ?? "", [params.roomId]);
  const isValid = isValidRoomId(roomId);
  const {
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
  } = useRoomMessages(roomId, isValid);

  if (!isValid) {
    return (
      <main className="room-page">
        <section className="room-chat">
          <p className="room-chat__error">{dictionary.invalidRoom}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="room-page">
      <section className="room-chat">
        <header className="room-chat__header">
          <div className="room-chat__header-top">
            <h2 className="room-chat__title">
              {dictionary.roomLabel}: <code>{roomId}</code>
            </h2>
            <button
              type="button"
              className="room-chat__refresh-button"
              onClick={() => {
                void refresh();
              }}
              disabled={loading || sending || uploading}
              aria-label={dictionary.refresh}
              title={dictionary.refresh}
            >
              <RefreshIcon />
            </button>
          </div>
          <p className="room-chat__note">{dictionary.roomNote}</p>
        </header>

        {loading ? <p className="room-chat__loading">{dictionary.loading}</p> : null}
        {error ? <p className="room-chat__error">{error}</p> : null}
        <MessageList dictionary={dictionary} messages={messages} />

        <MessageComposer
          dictionary={dictionary}
          sending={sending}
          uploading={uploading}
          uploadLoaded={uploadLoaded}
          uploadTotal={uploadTotal}
          onSubmitText={submitText}
          onSubmitFile={submitFile}
        />
      </section>
    </main>
  );
}

function RefreshIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className="room-chat__refresh-icon" aria-hidden="true">
      <path
        d="M12 5a7 7 0 1 1-6.7 9H3a1 1 0 0 1 0-2h3.5a1 1 0 0 1 1 1v3a1 1 0 0 1-2 0v-.8A5 5 0 1 0 12 7c-.9 0-1.8.2-2.5.7a1 1 0 0 1-1-1.7A7 7 0 0 1 12 5Zm0-3a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1Z"
        fill="currentColor"
      />
    </svg>
  );
}
