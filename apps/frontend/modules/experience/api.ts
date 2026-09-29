import { apiClient } from "../../lib/api-client";
import type { Experience } from "./types";

export function listExperiences() {
  return apiClient<{ experience: Experience[] }>("/profile", { method: "GET" }).then(
    (profile) => profile.experience || [],
  );
}
