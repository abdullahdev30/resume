import { apiClient } from "../../lib/api-client";
import type { Education, EducationPayload } from "./types";

export function listEducations() {
  return apiClient<Education[]>("/profile/education", { method: "GET" });
}

export function createEducation(payload: EducationPayload) {
  return apiClient<Education>("/profile/education", { method: "POST", body: payload });
}

export function updateEducation(id: string, payload: Partial<EducationPayload>) {
  return apiClient<Education>(`/profile/education/${id}`, { method: "PUT", body: payload });
}

export function deleteEducation(id: string) {
  return apiClient<{ message: string }>(`/profile/education/${id}`, { method: "DELETE" });
}
