import type { LanguageCode } from "./languages";

const KEY = "resume-builder-resume-language";
const SUPPORTED: LanguageCode[] = ["en", "ar", "ur", "de", "es", "it", "zh"];

export function getResumeLanguagePreference(): LanguageCode {
  if (typeof window === "undefined") return "en";
  try {
    const value = window.localStorage.getItem(KEY);
    return SUPPORTED.includes(value as LanguageCode)
      ? (value as LanguageCode)
      : "en";
  } catch {
    return "en";
  }
}

export function setResumeLanguagePreference(value: LanguageCode): void {
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    // The preference remains active for the current view if storage is unavailable.
  }
}
