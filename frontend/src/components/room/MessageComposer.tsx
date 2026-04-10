import { FormEvent, KeyboardEvent, useRef, useState } from "react";
import { formatBytes } from "../../lib/format";
import type { Dictionary } from "../../lib/types";

interface MessageComposerProps {
  dictionary: Dictionary;
  sending: boolean;
  uploading: boolean;
  uploadLoaded: number;
  uploadTotal: number;
  onSubmitText: (value: string) => Promise<void>;
  onSubmitFile: (file: File) => Promise<void>;
}

export function MessageComposer(props: MessageComposerProps): JSX.Element {
  const {
    dictionary,
    sending,
    uploading,
    uploadLoaded,
    uploadTotal,
    onSubmitText,
    onSubmitFile,
  } = props;
  const [content, setContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const progressPercent = uploadTotal > 0 ? Math.min(100, (uploadLoaded / uploadTotal) * 100) : 0;

  async function submitCurrentMessage(): Promise<void> {
    if (sending) {
      return;
    }

    if (!content.trim()) {
      return;
    }

    await onSubmitText(content);
    setContent("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await submitCurrentMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    void submitCurrentMessage();
  }

  async function handleSelectFile(fileList: FileList | null): Promise<void> {
    const file = fileList?.item(0);
    if (!file) {
      return;
    }

    await onSubmitFile(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <textarea
        className="composer__input"
        rows={3}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={dictionary.messagePlaceholder}
      />

      <div className="composer__actions">
        <label
          className="composer__icon-button"
          aria-label={uploading ? dictionary.uploading : dictionary.upload}
          title={uploading ? dictionary.uploading : dictionary.upload}
        >
          <PaperclipIcon />
          <input
            ref={fileInputRef}
            className="composer__file-input"
            type="file"
            onChange={(event) => {
              void handleSelectFile(event.target.files);
            }}
          />
        </label>

        <button
          type="submit"
          className="composer__icon-button composer__icon-button--primary"
          disabled={sending}
          aria-label={dictionary.send}
          title={dictionary.send}
        >
          <SendIcon />
        </button>
      </div>

      {uploading ? (
        <div className="composer__progress">
          <div
            className="composer__progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progressPercent)}
          >
            <div className="composer__progress-fill" style={{ width: `${progressPercent.toFixed(1)}%` }} />
          </div>
          <div className="composer__progress-meta">
            <span>{progressPercent.toFixed(1)}%</span>
            <span>
              {formatBytes(uploadLoaded)} / {formatBytes(uploadTotal)}
            </span>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function PaperclipIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className="composer__icon" aria-hidden="true">
      <path
        d="M8.5 17.5a4.5 4.5 0 0 0 6.4 0l5.2-5.2a4.5 4.5 0 0 0-6.4-6.4L8.1 11.5a2.5 2.5 0 0 0 3.5 3.5l4.6-4.6a1 1 0 0 0-1.4-1.4l-4.6 4.6a.5.5 0 0 1-.7-.7L15.1 7a2.5 2.5 0 0 1 3.5 3.5l-5.2 5.2a2.5 2.5 0 1 1-3.5-3.5l5.2-5.2a1 1 0 1 0-1.4-1.4l-5.2 5.2a4.5 4.5 0 0 0 0 6.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SendIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className="composer__icon" aria-hidden="true">
      <path
        d="M21.6 3.4a1 1 0 0 0-1-.2L3.4 10.1a1 1 0 0 0 .1 1.9l7.3 2.1 2.1 7.3a1 1 0 0 0 1.9.1l6.9-17.2a1 1 0 0 0-.1-1ZM13.9 17l-1.3-4.5a1 1 0 0 0-.7-.7L7.4 10.5l11.2-4.5L13.9 17Z"
        fill="currentColor"
      />
    </svg>
  );
}
