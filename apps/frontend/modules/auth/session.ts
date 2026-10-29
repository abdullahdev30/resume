/* eslint-disable no-control-regex -- Deliberately reject control characters in user input. */
// Auth flow state is isolated from resume data. Memory is a fallback when a
// browser blocks sessionStorage; passwords and session tokens never go here.
const memory = new Map<string, string>();

export function readAuthState(key: string): string {
  try {
    return sessionStorage.getItem(key) ?? memory.get(key) ?? "";
  } catch {
    return memory.get(key) ?? "";
  }
}

export function writeAuthState(key: string, value: string): void {
  memory.set(key, value);
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* Use memory. */
  }
}

export function removeAuthState(key: string): void {
  memory.delete(key);
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* Use memory. */
  }
}

export function safeAuthDestination(value: string | null): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\s\u0000-\u001f\u007f]/.test(value)
  )
    return "/dashboard";
  const pathname = value.split(/[?#]/)[0];
  return pathname?.startsWith("/auth") ? "/dashboard" : value;
}
