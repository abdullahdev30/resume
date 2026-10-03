import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BACKEND_API_BASE } from "../../lib/backend-api-url";
import { isSuccessfulHttpStatus } from "../../lib/http-status";
import type { User } from "./types";

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  if (!cookieHeader.includes("access_token=")) {
    return null;
  }

  try {
    const response = await fetch(`${BACKEND_API_BASE}/auth/me`, {
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!isSuccessfulHttpStatus(response.status)) {
      return null;
    }

    const user = await response.json() as User;
    return user.is_guest ? null : user;
  } catch {
    return null;
  }
}

export async function requireCurrentUser(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return user;
}
