import { apiClient } from "../../lib/api-client";
import type { Experience } from "./types";

export function listExperiences() {
  return apiClient<Experience[]>("/profile/experience", { method: "GET" });
}
