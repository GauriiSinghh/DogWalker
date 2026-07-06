import { useState, useEffect, useCallback } from "react";

const THEME_KEY = "zuppy_theme";
const COLLAPSED_KEY = "zuppy_sidebar_collapsed";

/** Read theme from localStorage before first paint to avoid flash. */
function readTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Sidebar state: theme + collapsed persistence.
 * Syncs zuppy_theme with adminTheme so the rest of the admin layout can follow on reload.
 */
export function useSidebar({ collapsed, onToggleCollapse }) {
  const [theme, setThemeState] = useState(readTheme);
  const [themeAnimating, setThemeAnimating] = useState(false);

  // Restore collapsed state from localStorage on mount (once per session)
  useEffect(() => {
    const key = "zuppy_sidebar_restored";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    const saved = readCollapsed();
    if (saved !== collapsed && onToggleCollapse) {
      onToggleCollapse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist collapsed state
  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, String(collapsed));
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const toggleTheme = useCallback(() => {
    setThemeAnimating(true);
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_KEY, next);
        localStorage.setItem("adminTheme", next);
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new CustomEvent("zuppy-theme-change", { detail: next }));
      return next;
    });
    setTimeout(() => setThemeAnimating(false), 300);
  }, []);

  const isDark = theme === "dark";

  return { theme, isDark, toggleTheme, themeAnimating };
}
