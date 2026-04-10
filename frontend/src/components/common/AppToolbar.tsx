import { Link } from "react-router-dom";
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
  const nextLanguage: Language = language === "vi" ? "en" : "vi";

  return (
    <header className="toolbar">
      <div className="toolbar__left">
        <h1 className="toolbar__title">
          <Link to="/" className="toolbar__title-link" aria-label={dictionary.backHome} title={dictionary.backHome}>
            {dictionary.appName}
          </Link>
        </h1>
      </div>

      <div className="toolbar__controls">
        <button
          type="button"
          className="toolbar__icon-button"
          onClick={() => {
            setLanguage(nextLanguage);
          }}
          aria-label={`${dictionary.language}: ${language.toUpperCase()}`}
          title={`${dictionary.language}: ${language.toUpperCase()}`}
        >
          <GlobeIcon />
          <span className="toolbar__lang-code">{language.toUpperCase()}</span>
        </button>

        <button
          type="button"
          className="toolbar__icon-button"
          onClick={() => {
            setTheme(theme === "dark" ? "light" : "dark");
          }}
          aria-label={`${dictionary.theme}: ${theme === "dark" ? dictionary.dark : dictionary.light}`}
          title={`${dictionary.theme}: ${theme === "dark" ? dictionary.dark : dictionary.light}`}
        >
          {theme === "dark" ? <MoonIcon /> : <SunIcon />}
        </button>
      </div>
    </header>
  );
}

function GlobeIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className="toolbar__icon" aria-hidden="true">
      <path
        d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm6.8 8h-3.1a14.7 14.7 0 0 0-1.4-5.3A7 7 0 0 1 18.8 11Zm-6.8-6c.7.8 1.9 2.8 2.6 6H9.4c.7-3.2 1.9-5.2 2.6-6ZM5.2 13h3.1a14.7 14.7 0 0 0 1.4 5.3A7 7 0 0 1 5.2 13Zm3.1-2H5.2a7 7 0 0 1 4.5-5.3A14.7 14.7 0 0 0 8.3 11Zm3.7 8c-.7-.8-1.9-2.8-2.6-6h5.2c-.7 3.2-1.9 5.2-2.6 6Zm2.3-.7a14.7 14.7 0 0 0 1.4-5.3h3.1a7 7 0 0 1-4.5 5.3Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SunIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className="toolbar__icon" aria-hidden="true">
      <path
        d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0-4a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm0 16a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1Zm9-7a1 1 0 0 1-1 1h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1ZM6 13H5a1 1 0 1 1 0-2h1a1 1 0 1 1 0 2Zm11.7 6.3a1 1 0 0 1-1.4 0l-.7-.7a1 1 0 0 1 1.4-1.4l.7.7a1 1 0 0 1 0 1.4ZM8.4 8.4a1 1 0 0 1-1.4 0l-.7-.7a1 1 0 0 1 1.4-1.4l.7.7a1 1 0 0 1 0 1.4Zm9.2 0a1 1 0 0 1 0-1.4l.7-.7a1 1 0 0 1 1.4 1.4l-.7.7a1 1 0 0 1-1.4 0ZM8.4 15.6a1 1 0 0 1 0 1.4l-.7.7a1 1 0 1 1-1.4-1.4l.7-.7a1 1 0 0 1 1.4 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MoonIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className="toolbar__icon" aria-hidden="true">
      <path
        d="M14.8 3.2a1 1 0 0 1 .2 1.1 7.2 7.2 0 0 0 8.7 9.7 1 1 0 0 1 1.2 1.2A10 10 0 1 1 13.5 2.1a1 1 0 0 1 1.3 1.1ZM12 4a8 8 0 1 0 7.4 10.8A9.2 9.2 0 0 1 13.2 6c0-.7.1-1.4.2-2Z"
        fill="currentColor"
      />
    </svg>
  );
}
