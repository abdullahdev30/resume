import { apiClient } from "../../lib/api-client";
import type { Skill } from "./types";

export function listSkills() {
  return apiClient<Skill[]>("/profile/skills", { method: "GET" });
}
