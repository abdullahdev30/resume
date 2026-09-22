"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "theme";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const nextTheme: Theme = stored === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    setThemeState(nextTheme);
  }, []);

  function setTheme(nextTheme: Theme) {
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setThemeState(nextTheme);
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return {
    theme,
    setTheme,
    toggleTheme,
  };
}
