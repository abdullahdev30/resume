import { apiClient } from "../../lib/api-client";
import type { Skill, SkillPayload } from "./types";

export function listSkills() {
  return apiClient<Skill[]>("/profile/skills", { method: "GET" });
}

export function createSkill(payload: SkillPayload) {
  return apiClient<Skill>("/profile/skills", { method: "POST", body: payload });
}

export function updateSkill(id: string, payload: Partial<SkillPayload>) {
  return apiClient<Skill>(`/profile/skills/${id}`, { method: "PUT", body: payload });
}

export function deleteSkill(id: string) {
  return apiClient<{ message: string }>(`/profile/skills/${id}`, { method: "DELETE" });
}
