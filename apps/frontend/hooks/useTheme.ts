"use client";

export type Theme = "light";
export const THEME_STORAGE_KEY = "resume-builder-theme";

export function useTheme() {
  const setTheme = (_nextTheme?: Theme) => {
    if (typeof document !== "undefined")
      document.documentElement.dataset.theme = "light";
  };
  return { theme: "light" as const, setTheme, toggleTheme: setTheme };
}
