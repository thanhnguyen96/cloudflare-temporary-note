import { useNavigate } from "react-router-dom";
import { JoinRoomCard } from "../components/join/JoinRoomCard";
import { toRoomId } from "../lib/room";
import type { Dictionary } from "../lib/types";

interface HomePageProps {
  dictionary: Dictionary;
}

export function HomePage({ dictionary }: HomePageProps): JSX.Element {
  const navigate = useNavigate();

  function handleJoin(input: string): void {
    const roomId = toRoomId(input);
    navigate(`/r/${roomId}`);
  }

  return (
    <main className="home-page">
      <JoinRoomCard dictionary={dictionary} onJoin={handleJoin} />
    </main>
  );
}

