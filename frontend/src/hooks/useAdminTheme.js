import { useState, useEffect, useCallback } from "react";

const THEME_KEY = "adminTheme";

export function useAdminTheme() {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "light" ? "light" : "dark";
  });

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const setTheme = useCallback((value) => {
    setThemeState(value === "light" ? "light" : "dark");
  }, []);

  return { theme, toggleTheme, setTheme, isDark: theme === "dark" };
}
