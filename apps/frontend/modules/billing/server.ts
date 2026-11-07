import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BACKEND_API_BASE } from "@/lib/backend-api-url";
import { requireCurrentUser } from "@/modules/auth/server";
import type { Membership } from "./types";

export async function requireSubscribedUser() {
  const user = await requireCurrentUser();
  const response = await fetch(`${BACKEND_API_BASE}/billing/me`, {
    headers: { cookie: (await cookies()).toString() },
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error("Unable to check your subscription. Please retry.");
  const membership = (await response.json()) as Membership;
  if (membership.role === "user" && membership.status !== "active")
    redirect("/packages");
  return user;
}
