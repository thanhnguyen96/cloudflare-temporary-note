import { Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "../pages/HomePage";
import { RoomPage } from "../pages/RoomPage";
import type { Dictionary } from "../lib/types";

interface AppRouterProps {
  dictionary: Dictionary;
}

export function AppRouter({ dictionary }: AppRouterProps): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<HomePage dictionary={dictionary} />} />
      <Route path="/r/:roomId" element={<RoomPage dictionary={dictionary} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

