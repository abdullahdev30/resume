"use client";
import { useSyncExternalStore } from "react";
const key = "resume-recently-opened";
const eventName = "resume-opened";
let memory = "{}";
function snapshot() {
  try {
    return sessionStorage.getItem(key) || memory;
  } catch {
    return memory;
  }
}
function parse(raw: string): Record<string, number> {
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(
        (entry): entry is [string, number] =>
          typeof entry[1] === "number" && Number.isFinite(entry[1]),
      ),
    );
  } catch {
    return {};
  }
}
function subscribe(listener: () => void) {
  window.addEventListener(eventName, listener);
  return () => window.removeEventListener(eventName, listener);
}
export function markResumeOpened(id: string) {
  if (!id) return;
  const opened = { ...parse(snapshot()), [id]: Date.now() };
  memory = JSON.stringify(
    Object.fromEntries(
      Object.entries(opened)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 100),
    ),
  );
  try {
    sessionStorage.setItem(key, memory);
  } catch {
    /* Keep metadata in memory. */
  }
  window.dispatchEvent(new Event(eventName));
}
export function useRecentlyOpened() {
  return parse(useSyncExternalStore(subscribe, snapshot, () => "{}"));
}
