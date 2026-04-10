import { useMemo, useState } from "react";
import { getDictionary } from "../lib/i18n";
import type { Dictionary, Language } from "../lib/types";

const STORAGE_KEY = "note24h-lang";

interface UseLanguageResult {
  language: Language;
  dictionary: Dictionary;
  setLanguage: (value: Language) => void;
}

export function useLanguage(): UseLanguageResult {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "en" ? "en" : "vi";
  });

  const dictionary = useMemo(() => getDictionary(language), [language]);

  function updateLanguage(next: Language): void {
    localStorage.setItem(STORAGE_KEY, next);
    setLanguage(next);
  }

  return {
    language,
    dictionary,
    setLanguage: updateLanguage,
  };
}

