import { apiClient } from "../../lib/api-client";
import type { Education } from "./types";

export function listEducations() {
  return apiClient<Education[]>("/profile/education", { method: "GET" });
}
