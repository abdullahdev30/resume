import { apiClient } from "../../lib/api-client";
import type { Skill } from "./types";

export function listSkills() {
  return apiClient<{ skills: Skill[] }>("/profile", { method: "GET" }).then(
    (profile) => profile.skills || [],
  );
}
