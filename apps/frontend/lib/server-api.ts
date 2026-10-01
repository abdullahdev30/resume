import "server-only";

import { cookies } from "next/headers";
import { isSuccessfulHttpStatus } from "./http-status";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
).replace(/\/$/, "");

export async function serverApi<T>(endpoint: string): Promise<T> {
  const cookieStore = await cookies();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!isSuccessfulHttpStatus(response.status)) {
    throw new Error(`Server API request failed with status ${response.status}`);
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}
