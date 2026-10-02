import "server-only";

import { cookies } from "next/headers";
import { BACKEND_API_BASE } from "./backend-api-url";
import { isSuccessfulHttpStatus } from "./http-status";

export async function serverApi<T>(endpoint: string): Promise<T> {
  const cookieStore = await cookies();
  const response = await fetch(`${BACKEND_API_BASE}${endpoint}`, {
    headers: { cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!isSuccessfulHttpStatus(response.status)) {
    throw new Error(`Server API request failed with status ${response.status}`);
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}
