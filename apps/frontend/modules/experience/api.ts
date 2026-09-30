import { apiClient } from "../../lib/api-client";
import type { Experience, ExperiencePayload } from "./types";

export function listExperiences() {
  return apiClient<Experience[]>("/profile/experience", { method: "GET" });
}

export function createExperience(payload: ExperiencePayload) {
  return apiClient<Experience>("/profile/experience", {
    method: "POST",
    body: toExperienceRequest(payload),
  });
}

export function updateExperience(id: string, payload: Partial<ExperiencePayload>) {
  return apiClient<Experience>(`/profile/experience/${id}`, {
    method: "PUT",
    body: toExperienceRequest(payload),
  });
}

export function deleteExperience(id: string) {
  return apiClient<{ message: string }>(`/profile/experience/${id}`, { method: "DELETE" });
}

function toExperienceRequest(payload: Partial<ExperiencePayload>) {
  return {
    ...(payload.company_name !== undefined ? { company_name: payload.company_name } : {}),
    ...(payload.institute_name !== undefined ? { institute_name: payload.institute_name } : {}),
    ...(payload.job_title !== undefined ? { position: payload.job_title } : {}),
    ...(payload.location !== undefined ? { location: payload.location } : {}),
    ...(payload.start_date !== undefined ? { start_date: payload.start_date } : {}),
    ...(payload.end_date !== undefined ? { end_date: payload.end_date } : {}),
    ...(payload.is_current !== undefined ? { is_current: payload.is_current } : {}),
    ...(payload.description !== undefined ? { description: payload.description } : {}),
  };
}
