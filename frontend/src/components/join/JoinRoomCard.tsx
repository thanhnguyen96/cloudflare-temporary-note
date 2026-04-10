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
        <button type="submit" className="join-card__submit">
          {dictionary.joinRoom}
        </button>
      </form>
    </section>
  );
}

