import { FiSun, FiMoon } from "react-icons/fi";

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="admin-theme-toggle"
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <span className={`admin-theme-toggle__track${isDark ? "" : " admin-theme-toggle__track--light"}`}>
        <span className="admin-theme-toggle__thumb">
          {isDark ? <FiMoon size={14} /> : <FiSun size={14} />}
        </span>
      </span>
    </button>
  );
}
