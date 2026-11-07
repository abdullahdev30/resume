"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { LANGUAGES, type LanguageCode, translate } from "@/lib/languages";

type LanguageContextValue = { language: LanguageCode; setLanguage: (value: LanguageCode) => void; t: (value: string) => string };
const LanguageContext = createContext<LanguageContextValue>({ language: "en", setLanguage: () => {}, t: (value) => value });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("resume-builder-app-language") as LanguageCode | null;
      if (saved && LANGUAGES.some((item) => item.code === saved)) setLanguageState(saved);
    } catch { /* Keep the default language when browser storage is unavailable. */ }
  }, []);
  useEffect(() => {
    const selected = LANGUAGES.find((item) => item.code === language)!;
    document.documentElement.lang = selected.code;
    document.documentElement.dir = selected.dir;
  }, [language]);
  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: (next) => {
      setLanguageState(next);
      try { localStorage.setItem("resume-builder-app-language", next); } catch { /* Preference remains active for this visit. */ }
    },
    t: (message) => translate(language, message),
  }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { return useContext(LanguageContext); }
