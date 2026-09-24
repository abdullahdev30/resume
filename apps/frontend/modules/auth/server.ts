import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "./types";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
).replace(/\/$/, "");

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  if (!cookieHeader.includes("access_token=")) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return response.json() as Promise<User>;
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