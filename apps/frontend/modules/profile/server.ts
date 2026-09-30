import "server-only";

import { serverApi } from "@/lib/server-api";
import type { ProfileResponse } from "./types";

export async function getProfileOnServer(): Promise<ProfileResponse | null> {
  try {
    return await serverApi<ProfileResponse>("/profile");
  } catch {
    return null;
  }
}
