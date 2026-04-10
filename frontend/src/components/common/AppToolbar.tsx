import { Link, useLocation } from "react-router-dom";
import type { Dictionary, Language, Theme } from "../../lib/types";

interface AppToolbarProps {
  dictionary: Dictionary;
  language: Language;
  setLanguage: (language: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export function AppToolbar(props: AppToolbarProps): JSX.Element {
  const { dictionary, language, setLanguage, theme, setTheme } = props;
  const location = useLocation();
  const onRoomPage = location.pathname.startsWith("/r/");

  return (
    <header className="toolbar">
      <div className="toolbar__left">
        <h1 className="toolbar__title">{dictionary.appName}</h1>
        {onRoomPage ? (
          <Link to="/" className="toolbar__back-link">
            {dictionary.backHome}
          </Link>
        ) : null}
      </div>

      <div className="toolbar__controls">
        <label className="toolbar__control">
          <span className="toolbar__control-label">{dictionary.language}</span>
          <select
            className="toolbar__select"
            value={language}
            onChange={(event) => {
              setLanguage(event.target.value as Language);
            }}
          >
            <option value="vi">VI</option>
            <option value="en">EN</option>
          </select>
        </label>

        <button
          type="button"
          className="toolbar__theme-button"
          onClick={() => {
            setTheme(theme === "dark" ? "light" : "dark");
          }}
        >
          {dictionary.theme}: {theme === "dark" ? dictionary.dark : dictionary.light}
        </button>
      </div>
    </header>
  );
}

