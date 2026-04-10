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
        <label className="composer__upload-button">
          {uploading ? dictionary.uploading : dictionary.upload}
          <input
            ref={fileInputRef}
            className="composer__file-input"
            type="file"
            onChange={(event) => {
              void handleSelectFile(event.target.files);
            }}
          />
        </label>

        <button type="submit" className="composer__send-button" disabled={sending}>
          {dictionary.send}
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
