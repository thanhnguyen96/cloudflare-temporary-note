import { useEffect, useState } from "react";
import type { Theme } from "../lib/types";

const STORAGE_KEY = "note24h-theme";

interface UseThemeResult {
  theme: Theme;
  setTheme: (value: Theme) => void;
}

export function useTheme(): UseThemeResult {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "light" ? "light" : "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return { theme, setTheme };
}

