import { apiClient } from "../../lib/api-client";
import type { Project, ProjectPayload } from "./types";

export function listProjects() {
  return apiClient<Project[]>("/profile/projects", { method: "GET" });
}

export function createProject(payload: ProjectPayload) {
  return apiClient<Project>("/profile/projects", { method: "POST", body: payload });
}

export function updateProject(id: string, payload: Partial<ProjectPayload>) {
  return apiClient<Project>(`/profile/projects/${id}`, { method: "PUT", body: payload });
}

export function deleteProject(id: string) {
  return apiClient<{ message: string }>(`/profile/projects/${id}`, { method: "DELETE" });
}
