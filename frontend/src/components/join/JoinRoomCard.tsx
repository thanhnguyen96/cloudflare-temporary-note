import { FormEvent, useState } from "react";
import type { Dictionary } from "../../lib/types";

interface JoinRoomCardProps {
  dictionary: Dictionary;
  onJoin: (input: string) => void;
}

export function JoinRoomCard({ dictionary, onJoin }: JoinRoomCardProps): JSX.Element {
  const [input, setInput] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onJoin(input);
  }

  return (
    <section className="join-card">
      <h2 className="join-card__title">{dictionary.enterRoom}</h2>
      <p className="join-card__hint">{dictionary.joinHint}</p>

      <form className="join-card__form" onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={dictionary.roomInputPlaceholder}
          className="join-card__input"
          autoComplete="off"
        />
        <button
          type="submit"
          className="join-card__submit"
          aria-label={dictionary.joinRoom}
          title={dictionary.joinRoom}
        >
          <ArrowRightIcon />
        </button>
      </form>
    </section>
  );
}

function ArrowRightIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className="join-card__submit-icon" aria-hidden="true">
      <path
        d="M13.3 5.3a1 1 0 0 0-1.4 1.4l4.3 4.3H4a1 1 0 1 0 0 2h12.2l-4.3 4.3a1 1 0 0 0 1.4 1.4l6-6a1 1 0 0 0 0-1.4l-6-6Z"
        fill="currentColor"
      />
    </svg>
  );
}
