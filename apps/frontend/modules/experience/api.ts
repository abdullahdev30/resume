import { apiClient } from "../../lib/api-client";
import type { Experience, ExperiencePayload } from "./types";

export function listExperiences() {
  return apiClient<Experience[]>("/profile/experience", { method: "GET" });
}

export function createExperience(payload: ExperiencePayload) {
  return apiClient<Experience>("/profile/experience", { method: "POST", body: payload });
}

export function updateExperience(id: string, payload: Partial<ExperiencePayload>) {
  return apiClient<Experience>(`/profile/experience/${id}`, { method: "PUT", body: payload });
}

export function deleteExperience(id: string) {
  return apiClient<{ message: string }>(`/profile/experience/${id}`, { method: "DELETE" });
}
