import { AppRouter } from "./AppRouter";
import { AppToolbar } from "../components/common/AppToolbar";
import { useLanguage } from "../hooks/useLanguage";
import { useTheme } from "../hooks/useTheme";

export function App(): JSX.Element {
  const { language, dictionary, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  return (
    <div className="app-shell">
      <AppToolbar
        dictionary={dictionary}
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
      />
      <AppRouter dictionary={dictionary} />
    </div>
  );
}

