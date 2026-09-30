import { apiClient } from "../../lib/api-client";
import type { Education, EducationPayload } from "./types";

export function listEducations() {
  return apiClient<Education[]>("/profile/education", { method: "GET" });
}

export function createEducation(payload: EducationPayload) {
  return apiClient<Education>("/profile/education", {
    method: "POST",
    body: toEducationRequest(payload),
  });
}

export function updateEducation(id: string, payload: Partial<EducationPayload>) {
  return apiClient<Education>(`/profile/education/${id}`, {
    method: "PUT",
    body: toEducationRequest(payload),
  });
}

export function deleteEducation(id: string) {
  return apiClient<{ message: string }>(`/profile/education/${id}`, { method: "DELETE" });
}

function toEducationRequest(payload: Partial<EducationPayload>) {
  return {
    ...(payload.institute_name !== undefined ? { institution: payload.institute_name } : {}),
    ...(payload.degree !== undefined ? { degree: payload.degree } : {}),
    ...(payload.field_of_study !== undefined ? { field_of_study: payload.field_of_study } : {}),
    ...(payload.start_date !== undefined ? { start_date: payload.start_date } : {}),
    ...(payload.end_date !== undefined ? { end_date: payload.end_date } : {}),
    ...(payload.is_current !== undefined ? { is_current: payload.is_current } : {}),
    ...(payload.description !== undefined ? { description: payload.description } : {}),
    ...(payload.grade !== undefined ? { grade: payload.grade } : {}),
  };
}
